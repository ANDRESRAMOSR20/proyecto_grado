from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from sqlalchemy import func, case
from sqlalchemy.orm import sessionmaker

# Import route registrations
from architecture.cv_processor import register_routes
from architecture.model import create_embeddings
from architecture.vectordb import search_similar_chunks_for_filename
from auth.create_db import create_tables, engine, User, Job, Application, ApplicationStage, seed_jobs_if_empty
from auth.utils.token_validator import validate_auth_header
from io import BytesIO
import base64

AUTO_REJECTION_FEEDBACK = "su curriculum no cumple con los requerimientos tecnicos que la vacante necesita"

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)
    
    # Ensure database tables exist and run lightweight migrations
    try:
        create_tables()
        # Seed example jobs if none exist (to make offers visible)
        seed_jobs_if_empty()
    except Exception as e:
        print(f"⚠️ Could not initialize database tables: {e}")

    # Register routes
    register_routes(app)
    
    # Add user profile routes
    @app.route('/api/user/profile', methods=['POST'])
    def update_profile():
        """Endpoint to update user profile"""
        from auth.user_profile import handle_profile_request
        return handle_profile_request(request.data)

    @app.route('/api/user/profile/get', methods=['POST'])
    def get_profile():
        """Endpoint to get user profile"""
        from auth.user_profile import handle_profile_get_request
        return handle_profile_get_request(request.data)
    
    # Database session factory
    Session = sessionmaker(bind=engine)

    @app.route('/api/jobs', methods=['GET'])
    def list_jobs():
        """Return all jobs"""
        session = Session()
        try:
            jobs = session.query(Job).order_by(Job.created_at.desc()).all()
            return jsonify([
                {
                    "id": job.id,
                    "title_job": job.title_job,
                    "description": job.description,
                    "perfil_ideal": getattr(job, "perfil_ideal", None),
                    "posted_date": job.posted_date.isoformat() if job.posted_date else None,
                    "created_at": job.created_at.isoformat() if job.created_at else None
                }
                for job in jobs
            ])
        finally:
            session.close()

    # Admin: jobs CRUD
    @app.route('/api/admin/jobs', methods=['GET'])
    def admin_list_jobs():
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403
        session = Session()
        try:
            jobs = session.query(Job).order_by(Job.created_at.desc()).all()
            return jsonify([
                {
                    "id": job.id,
                    "title_job": job.title_job,
                    "description": job.description,
                    "perfil_ideal": getattr(job, "perfil_ideal", None),
                    "posted_date": job.posted_date.isoformat() if job.posted_date else None,
                    "created_at": job.created_at.isoformat() if job.created_at else None
                }
                for job in jobs
            ])
        finally:
            session.close()

    @app.route('/api/admin/jobs', methods=['POST'])
    def admin_create_job():
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403
        from datetime import datetime

        from datetime import datetime

        from datetime import datetime

        from datetime import datetime

        from datetime import datetime

        data = request.get_json(silent=True) or {}
        title_job = data.get('title_job')
        description = data.get('description')
        posted_date = data.get('posted_date')  # ISO string optional
        perfil_ideal = data.get('perfil_ideal')
        if not title_job or not description:
            return jsonify({"error": "title_job and description are required"}), 400
        session = Session()
        try:
            job = Job(title_job=title_job, description=description)
            if perfil_ideal is not None:
                setattr(job, 'perfil_ideal', perfil_ideal)
            if posted_date:
                try:
                    from datetime import datetime
                    job.posted_date = datetime.fromisoformat(posted_date)
                except Exception:
                    job.posted_date = None
            session.add(job)
            session.commit()
            return jsonify({"success": True, "id": job.id}), 201
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route('/api/admin/jobs/<int:job_id>', methods=['PATCH'])
    def admin_update_job(job_id: int):
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403
        data = request.get_json(silent=True) or {}
        session = Session()
        try:
            job = session.query(Job).filter(Job.id == job_id).first()
            if not job:
                return jsonify({"error": "Job not found"}), 404
            if 'title_job' in data:
                job.title_job = data['title_job']
            if 'description' in data:
                job.description = data['description']
            if 'perfil_ideal' in data:
                setattr(job, 'perfil_ideal', data['perfil_ideal'])
            if 'posted_date' in data:
                val = data['posted_date']
                if val:
                    from datetime import datetime
                    try:
                        job.posted_date = datetime.fromisoformat(val)
                    except Exception:
                        job.posted_date = None
                else:
                    job.posted_date = None
            session.commit()
            return jsonify({"success": True})
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route('/api/admin/jobs/<int:job_id>', methods=['DELETE'])
    def admin_delete_job(job_id: int):
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403
        session = Session()
        try:
            job = session.query(Job).filter(Job.id == job_id).first()
            if not job:
                return jsonify({"error": "Job not found"}), 404
            session.delete(job)
            session.commit()
            return jsonify({"success": True})
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route('/api/applications', methods=['POST'])
    def create_application():
        """Create a new application for the authenticated user and initialize timeline"""
        # Validate auth
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401

        data = request.get_json(silent=True) or {}
        job_id = data.get('job_id')
        if not job_id:
            return jsonify({"error": "job_id is required"}), 400

        session = Session()
        try:
            # Find user by email (sub)
            email = auth_result['payload'].get('sub')
            user = session.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            job = session.query(Job).filter(Job.id == job_id).first()
            if not job:
                return jsonify({"error": "Job not found"}), 404

            # Prevent duplicate applications for the same job
            existing = session.query(Application).filter(
                Application.user_id == user.id,
                Application.job_id == job.id
            ).first()
            if existing:
                return jsonify({"success": True, "application_id": existing.id}), 200

            # Preselection: compute similarity if possible
            similarity_score = None
            try:
                perfil_ideal_text = getattr(job, 'perfil_ideal', None)
                # get resume filename from meta_users if available
                meta = getattr(user, 'meta_user', None)
                resume_filename = None
                if meta is not None:
                    resume_filename = getattr(meta, 'resume_pdf', None)
                if perfil_ideal_text and resume_filename:
                    emb = create_embeddings([perfil_ideal_text])
                    if emb and len(emb[0]) > 0:
                        results = search_similar_chunks_for_filename(emb[0], resume_filename, limit=5)
                        if results:
                            similarity_score = max(r.get('similarity', 0.0) for r in results)
                        else:
                            similarity_score = 0.0
            except Exception:
                # If embedding/search fails, skip gating gracefully
                similarity_score = None

            # Create application and timeline
            application = Application(user_id=user.id, job_id=job.id, status='in_progress')
            session.add(application)
            session.flush()

            from datetime import datetime
            now = datetime.utcnow()

            # Determine if should auto-reject based on 80% threshold
            auto_reject = False
            if similarity_score is not None:
                try:
                    auto_reject = (float(similarity_score) * 100.0) < 80.0
                except Exception:
                    auto_reject = False

            result_status = 'pending'
            result_feedback = None
            result_date = None
            if auto_reject:
                result_status = 'rejected'
                result_feedback = AUTO_REJECTION_FEEDBACK
                result_date = now
                application.status = 'rejected'

            preselection_status = 'pending'
            preselection_date = None
            preselection_feedback = None
            if similarity_score is not None:
                preselection_date = now
                if auto_reject:
                    preselection_status = 'rejected'
                    preselection_feedback = AUTO_REJECTION_FEEDBACK
                else:
                    preselection_status = 'completed'

            stages = [
                ApplicationStage(
                    application_id=application.id,
                    name='application',
                    status='completed',
                    date=now,
                    sort_order=1
                ),
                ApplicationStage(
                    application_id=application.id,
                    name='preselection',
                    status=preselection_status,
                    date=preselection_date,
                    feedback=preselection_feedback,
                    sort_order=2
                ),
                ApplicationStage(
                    application_id=application.id,
                    name='interview',
                    status='pending',
                    date=None,
                    sort_order=3
                ),
                ApplicationStage(
                    application_id=application.id,
                    name='test',
                    status='pending',
                    date=None,
                    sort_order=4
                ),
                ApplicationStage(
                    application_id=application.id,
                    name='result',
                    status=result_status,
                    date=result_date,
                    feedback=result_feedback,
                    sort_order=5
                ),
            ]
            session.add_all(stages)
            session.commit()

            return jsonify({"success": True, "application_id": application.id}), 201
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route('/api/applications', methods=['GET'])
    def list_applications():
        """Return applications of the authenticated user with timeline"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401

        session = Session()
        try:
            email = auth_result['payload'].get('sub')
            user = session.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            apps = (
                session.query(Application)
                .filter(Application.user_id == user.id)
                .all()
            )

            result = []
            for app_row in apps:
                job = session.query(Job).filter(Job.id == app_row.job_id).first()
                stages = (
                    session.query(ApplicationStage)
                    .filter(ApplicationStage.application_id == app_row.id)
                    .order_by(ApplicationStage.sort_order.asc())
                    .all()
                )
                result.append({
                    "id": app_row.id,
                    "job": {
                        "id": job.id,
                        "title_job": job.title_job,
                        "description": job.description,
                    } if job else None,
                    "status": app_row.status,
                    "created_at": app_row.created_at.isoformat() if app_row.created_at else None,
                    "timeline": [
                        {
                            "name": st.name,
                            "status": st.status,
                            "date": st.date.isoformat() if st.date else None,
                            "feedback": st.feedback
                        }
                        for st in stages
                    ]
                })

            return jsonify(result)
        finally:
            session.close()

    @app.route('/api/applications/<int:application_id>', methods=['DELETE'])
    def delete_application(application_id: int):
        """Allow the authenticated user to delete their own application"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401

        session = Session()
        try:
            email = auth_result['payload'].get('sub')
            user = session.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            app_row = session.query(Application).filter(Application.id == application_id).first()
            if not app_row:
                return jsonify({"error": "Application not found"}), 404

            if app_row.user_id != user.id:
                return jsonify({"error": "Forbidden"}), 403

            session.delete(app_row)
            session.commit()
            return jsonify({"success": True})
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    # --- Admin endpoints ---
    @app.route('/api/admin/applications', methods=['GET'])
    def admin_list_applications():
        """Admin: list all applications with user, job and timeline"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        session = Session()
        try:
            apps = session.query(Application).all()
            result = []
            for app_row in apps:
                job = session.query(Job).filter(Job.id == app_row.job_id).first()
                user = session.query(User).filter(User.id == app_row.user_id).first()
                stages = (
                    session.query(ApplicationStage)
                    .filter(ApplicationStage.application_id == app_row.id)
                    .order_by(ApplicationStage.sort_order.asc())
                    .all()
                )
                # Compute similarity percent if possible
                similarity_percent = None
                try:
                    perfil_ideal_text = getattr(job, 'perfil_ideal', None) if job else None
                    resume_filename = None
                    if user and getattr(user, 'meta_user', None) is not None:
                        resume_filename = getattr(user.meta_user, 'resume_pdf', None)
                    if perfil_ideal_text and resume_filename:
                        emb = create_embeddings([perfil_ideal_text])
                        if emb and len(emb[0]) > 0:
                            matches = search_similar_chunks_for_filename(emb[0], resume_filename, limit=5)
                            if matches:
                                best = max(m.get('similarity', 0.0) for m in matches)
                                similarity_percent = round(float(best) * 100.0, 2)
                except Exception:
                    similarity_percent = None
                result.append({
                    "id": app_row.id,
                    "job": {
                        "id": job.id,
                        "title_job": job.title_job,
                        "description": job.description,
                    } if job else None,
                    "user": {
                        "id": user.id if user else None,
                        "email": user.email if user else None,
                        "name": user.name if user else None,
                    },
                    "status": app_row.status,
                    "created_at": app_row.created_at.isoformat() if app_row.created_at else None,
                    "similarity_percent": similarity_percent,
                    "timeline": [
                        {
                            "name": st.name,
                            "status": st.status,
                            "date": st.date.isoformat() if st.date else None,
                            "feedback": st.feedback
                        }
                        for st in stages
                    ]
                })
            return jsonify(result)
        finally:
            session.close()

    def get_result_stage_breakdown(session):
        total_count, accepted_count, rejected_total = session.query(
            func.count(ApplicationStage.id),
            func.sum(case((ApplicationStage.status.in_(("completed", "accepted")), 1), else_=0)),
            func.sum(case((ApplicationStage.status == 'rejected', 1), else_=0)),
        ).filter(ApplicationStage.name == 'result').one()

        rejected_preselection = session.query(func.count(ApplicationStage.id)).filter(
            ApplicationStage.name == 'preselection',
            ApplicationStage.status == 'rejected'
        ).scalar() or 0

        accepted = int(accepted_count or 0)
        rejected_total = int(rejected_total or 0)
        rejected_preselection = int(rejected_preselection or 0)
        total = int(total_count or 0)
        rejected_process = max(0, rejected_total - rejected_preselection)
        pending = max(0, total - accepted - rejected_total)

        return {
            "accepted": accepted,
            "rejected_process": rejected_process,
            "rejected_preselection": rejected_preselection,
            "pending": pending,
        }

    # --- Admin metrics endpoints ---
    @app.route('/api/admin/metrics/summary', methods=['GET'])
    def admin_metrics_summary():
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        session = Session()
        try:
            # Totals
            total_users = session.query(func.count(User.id)).scalar() or 0
            total_jobs = session.query(func.count(Job.id)).scalar() or 0
            total_applications = session.query(func.count(Application.id)).scalar() or 0

            # Applications by stage status (single aggregated query)
            status_field = func.coalesce(Application.status, 'pending')
            status_rows = (
                session.query(status_field.label('status'), func.count(Application.id).label('total'))
                .group_by(status_field)
                .all()
            )
            status_order = ['pending', 'in_progress', 'scheduled', 'completed', 'rejected', 'accepted']
            status_counts = {status: 0 for status in status_order}
            for row in status_rows:
                key = row.status or 'pending'
                status_counts[key] = int(row.total or 0)
            by_status = {status: status_counts.get(status, 0) for status in status_order}

            # Applications per job (aggregated query)
            per_job_rows = (
                session.query(
                    Job.id.label('job_id'),
                    Job.title_job.label('title_job'),
                    func.count(Application.id).label('applications')
                )
                .outerjoin(Application, Application.job_id == Job.id)
                .group_by(Job.id)
                .order_by(Job.id)
                .all()
            )
            per_job = [
                {
                    "job_id": row.job_id,
                    "title_job": row.title_job,
                    "applications": int(row.applications or 0)
                }
                for row in per_job_rows
            ]

            result_breakdown = get_result_stage_breakdown(session)

            return jsonify({
                "totals": {"users": total_users, "jobs": total_jobs, "applications": total_applications},
                "applications_by_status": by_status,
                "applications_per_job": per_job,
                "result_breakdown": result_breakdown,
            })
        finally:
            session.close()

    @app.route('/api/admin/metrics/plots/<string:kind>', methods=['GET'])
    def admin_metrics_plot(kind: str):
        """Return small matplotlib plots as base64 PNG images.
        Kinds: by_status_bar, per_job_bar, result_outcome_pie, time_series_daily
        """
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from matplotlib.patches import Patch
        from collections import defaultdict
        from datetime import datetime

        session = Session()
        try:
            buf = BytesIO()

            if kind == 'by_status_bar':
                status_field = func.coalesce(Application.status, 'pending')
                status_rows = (
                    session.query(status_field.label('status'), func.count(Application.id).label('total'))
                    .group_by(status_field)
                    .all()
                )
                status_order = ['pending', 'in_progress', 'scheduled', 'completed', 'rejected', 'accepted']
                status_counts = {status: 0 for status in status_order}
                for row in status_rows:
                    key = row.status or 'pending'
                    status_counts[key] = int(row.total or 0)
                labels = status_order
                values = [status_counts[s] for s in labels]
                fig, ax = plt.subplots(figsize=(8, 4))
                ax.bar(labels, values, color='#00d6ab')
                ax.set_ylabel('Postulaciones')
                ax.set_title('Postulaciones por estado')
                fig.tight_layout()
                fig.savefig(buf, format='png', dpi=150)
            elif kind == 'per_job_bar':
                per_job_rows = (
                    session.query(
                        Job.title_job.label('title'),
                        func.count(Application.id).label('applications')
                    )
                    .outerjoin(Application, Application.job_id == Job.id)
                    .group_by(Job.id)
                    .order_by(func.count(Application.id).desc(), Job.title_job)
                    .all()
                )

                if not per_job_rows:
                    fig, ax = plt.subplots(figsize=(5, 3.5))
                    ax.text(0.5, 0.5, 'Sin datos', ha='center', va='center', fontsize=12)
                    ax.axis('off')
                else:
                    labels = [row.title for row in per_job_rows]
                    values = [int(row.applications or 0) for row in per_job_rows]
                    height = max(4, 0.5 * len(labels))
                    fig, ax = plt.subplots(figsize=(10, height))
                    y_pos = list(range(len(labels)))
                    ax.barh(y_pos, values, color='#00b9cd')
                    ax.set_yticks(y_pos)
                    ax.set_yticklabels(labels, fontsize=9)
                    ax.invert_yaxis()  # mantiene el primer elemento arriba
                    ax.set_xlabel('Postulaciones')
                    ax.set_title('Postulaciones por vacante')
                    fig.tight_layout()

                fig.savefig(buf, format='png', dpi=150)
            elif kind == 'result_outcome_pie':
                breakdown = get_result_stage_breakdown(session)
                segments = [
                    ('Aceptados', breakdown.get('accepted', 0), '#00d6ab'),
                    ('Rechazados en proceso', breakdown.get('rejected_process', 0), '#ef476f'),
                    ('Rechazados en preselección', breakdown.get('rejected_preselection', 0), '#ffd166'),
                ]
                total = sum(value for _, value, _ in segments)

                fig, ax = plt.subplots(figsize=(7, 5))
                if total == 0:
                    ax.text(0.5, 0.5, 'Sin datos', ha='center', va='center', fontsize=12)
                    ax.axis('off')
                else:
                    labels = [label for label, _, _ in segments]
                    values = [value for _, value, _ in segments]
                    colors = [color for _, _, color in segments]

                    def autopct(pct):
                        return f"{pct:.1f}%" if pct > 0 else ''

                    wedges, _, autotexts = ax.pie(
                        values,
                        colors=colors,
                        autopct=autopct,
                        startangle=90,
                        pctdistance=0.7,
                        textprops={'color': '#1f1f1f', 'fontsize': 10}
                    )
                    for autotext in autotexts:
                        autotext.set_fontweight('bold')

                    legend_labels = [f"{label} ({value})" for label, value in zip(labels, values)]
                    legend_handles = [Patch(facecolor=color, edgecolor='none') for color in colors]
                    ax.legend(
                        legend_handles,
                        legend_labels,
                        loc='center left',
                        bbox_to_anchor=(1.05, 0.5),
                        frameon=False,
                        borderaxespad=0,
                        fontsize=10
                    )
                    ax.axis('equal')

                fig.tight_layout()
                fig.savefig(buf, format='png', dpi=150)
            elif kind == 'time_series_daily':
                apps = session.query(Application.created_at).all()
                counts = defaultdict(int)
                for (created_at,) in apps:
                    day = (created_at or datetime.utcnow()).date().isoformat()
                    counts[day] += 1
                ordered = sorted(counts.items())
                x_labels = [d for d,_ in ordered]
                y_values = [v for _,v in ordered]
                positions = list(range(len(x_labels)))
                fig, ax = plt.subplots(figsize=(8, 4))
                ax.plot(positions, y_values, color='#00d6ab', marker='o')
                ax.set_xticks(positions)
                ax.set_xticklabels(x_labels, rotation=45, ha='right')
                ax.set_ylabel('Postulaciones')
                ax.set_title('Postulaciones por día')
                fig.tight_layout()
                fig.savefig(buf, format='png', dpi=150)
            else:
                return jsonify({"error": "Unknown plot kind"}), 400

            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close('all')
            return jsonify({"image_base64": f"data:image/png;base64,{b64}"})
        finally:
            session.close()

    @app.route('/api/admin/cv/match', methods=['POST'])
    def admin_match_cv_jobs():
        """Admin: given a stored resume filename, return similarity to all jobs"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        data = request.get_json(silent=True) or {}
        filename = data.get('filename')
        if not filename:
            return jsonify({"error": "filename is required"}), 400

        session = Session()
        try:
            jobs = session.query(Job).all()
            results = []
            for job in jobs:
                perfil_ideal_text = getattr(job, 'perfil_ideal', None)
                if not perfil_ideal_text:
                    continue
                percent = None
                try:
                    emb = create_embeddings([perfil_ideal_text])
                    if emb and len(emb[0]) > 0:
                        matches = search_similar_chunks_for_filename(emb[0], filename, limit=5)
                        if matches:
                            best = max(m.get('similarity', 0.0) for m in matches)
                            percent = round(float(best) * 100.0, 2)
                except Exception:
                    percent = None
                results.append({
                    "job": {
                        "id": job.id,
                        "title_job": job.title_job,
                        "description": job.description,
                    },
                    "similarity_percent": percent
                })
            # Sort by best first
            results.sort(key=lambda x: (x['similarity_percent'] is None, -(x['similarity_percent'] or 0)))
            return jsonify(results)
        finally:
            session.close()

    @app.route('/api/admin/applications/from_cv', methods=['POST'])
    def admin_create_application_from_cv():
        """Admin: create an application from a stored CV filename and candidate metadata"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        data = request.get_json(silent=True) or {}
        filename = data.get('filename')
        job_id = data.get('job_id')
        candidate = data.get('candidate') or {}
        name = candidate.get('name')
        email = candidate.get('email')
        identity_document = candidate.get('identity_document')  # optional
        celular = candidate.get('celular')
        if not all([filename, job_id, name, email, celular]):
            return jsonify({"error": "filename, job_id and candidate {name,email,celular} are required"}), 400

        session = Session()
        try:
            job = session.query(Job).filter(Job.id == int(job_id)).first()
            if not job:
                return jsonify({"error": "Job not found"}), 404

            # Find or create user
            user = session.query(User).filter(User.email == email).first()
            if not user:
                # Generate identity_document if not provided
                gen_doc = identity_document
                if not gen_doc:
                    import time, random
                    base = email.split('@')[0] if email else 'user'
                    gen_doc = f"AUTO-{base}-{int(time.time())}-{random.randint(1000,9999)}"
                user = User(name=name, email=email, identity_document=gen_doc, is_admin=False)
                session.add(user)
                session.flush()
            else:
                user.name = name
                if identity_document:
                    user.identity_document = identity_document

            # Upsert meta user
            from auth.create_db import MetaUser
            profile = session.query(MetaUser).filter(MetaUser.user_id == user.id).first()
            if not profile:
                profile = MetaUser(user_id=user.id, fullname=name, celular=celular, resume_pdf=filename)
                session.add(profile)
            else:
                profile.fullname = name
                profile.celular = celular
                profile.resume_pdf = filename

            # Create application and stages
            # Prevent duplicates
            existing = session.query(Application).filter(Application.user_id == user.id, Application.job_id == job.id).first()
            if existing:
                return jsonify({"success": True, "application_id": existing.id}), 200

            application = Application(user_id=user.id, job_id=job.id, status='in_progress')
            session.add(application)
            session.flush()

            from datetime import datetime
            now = datetime.utcnow()
            stages = [
                ApplicationStage(application_id=application.id, name='application', status='completed', date=now, sort_order=1),
                ApplicationStage(application_id=application.id, name='preselection', status='pending', date=None, sort_order=2),
                ApplicationStage(application_id=application.id, name='interview', status='pending', date=None, sort_order=3),
                ApplicationStage(application_id=application.id, name='test', status='pending', date=None, sort_order=4),
                ApplicationStage(application_id=application.id, name='result', status='pending', date=None, sort_order=5),
            ]
            session.add_all(stages)
            session.commit()
            return jsonify({"success": True, "application_id": application.id}), 201
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route('/api/admin/applications/<int:application_id>/stage', methods=['PATCH'])
    def admin_update_stage(application_id: int):
        """Admin: update a specific stage of an application"""
        auth_header = request.headers.get('Authorization')
        auth_result = validate_auth_header(auth_header)
        if not auth_result.get('valid'):
            return jsonify({"error": auth_result.get('message', 'Unauthorized')}), 401
        if not auth_result['payload'].get('is_admin'):
            return jsonify({"error": "Forbidden"}), 403

        from datetime import datetime

        data = request.get_json(silent=True) or {}
        name = data.get('name')  # 'application' | 'preselection' | 'interview' | 'test' | 'result'
        status = data.get('status')  # 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'rejected' | 'accepted'
        date_str = data.get('date')
        feedback = data.get('feedback')
        if not name or not status:
            return jsonify({"error": "name and status are required"}), 400

        session = Session()
        try:
            app_row = session.query(Application).filter(Application.id == application_id).first()
            if not app_row:
                return jsonify({"error": "Application not found"}), 404

            # Find existing stage or create
            stage = (
                session.query(ApplicationStage)
                .where(ApplicationStage.application_id == application_id, ApplicationStage.name == name)
                .first()
            )
            if not stage:
                # Assign sort_order based on known sequence
                order_map = {"application": 1, "preselection": 2, "interview": 3, "test": 4, "result": 5}
                stage = ApplicationStage(
                    application_id=application_id,
                    name=name,
                    sort_order=order_map.get(name, 99)
                )
                session.add(stage)

            stage.status = status
            if date_str:
                try:
                    stage.date = datetime.fromisoformat(date_str)
                except Exception:
                    stage.date = None
            if feedback is not None:
                stage.feedback = feedback

            if status in ('completed', 'accepted', 'rejected') and not date_str and not stage.date:
                stage.date = datetime.utcnow()

            # Optionally update application high-level status
            if name == 'result' and status in ('accepted', 'rejected'):
                app_row.status = status
            if name == 'preselection' and status == 'rejected':
                result_stage = (
                    session.query(ApplicationStage)
                    .where(ApplicationStage.application_id == application_id, ApplicationStage.name == 'result')
                    .first()
                )
                if not result_stage:
                    result_stage = ApplicationStage(
                        application_id=application_id,
                        name='result',
                        sort_order=5
                    )
                    session.add(result_stage)
                result_stage.status = 'rejected'
                if not result_stage.date:
                    result_stage.date = stage.date or datetime.utcnow()
                if not result_stage.feedback:
                    result_stage.feedback = feedback or AUTO_REJECTION_FEEDBACK
                app_row.status = 'rejected'

            session.commit()
            return jsonify({"success": True})
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()
    
    return app

if __name__ == "__main__":
    app = create_app()
    
    # Get port from environment or default to 5000
    port = int(os.environ.get("PORT", 5000))
    
    # Run the app
    app.run(host="0.0.0.0", port=port, debug=True) 