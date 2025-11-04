import React, { useEffect, useMemo, useState } from 'react';
import adminService, { type AdminApplicationDto } from '../../services/adminService';
import { Filter, Trash2, Search, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

const stageOptions = ['application', 'preselection', 'interview', 'test', 'result'] as const;
const statusOptions = ['pending', 'in_progress', 'scheduled', 'completed', 'rejected', 'accepted'] as const;

type StageName = typeof stageOptions[number];
type StageStatus = typeof statusOptions[number];

const stageLabel: Record<StageName, string> = {
  application: 'Aplicación',
  preselection: 'Preselección',
  interview: 'Entrevista',
  test: 'Evaluación',
  result: 'Resultado',
};

type GeneralStatus = 'En Proceso' | 'Finalizado' | 'Descartado';

const deriveStageStatus = (app: AdminApplicationDto, stage: StageName): StageStatus | 'pending' => {
  const entry = app.timeline.find(t => t.name === stage);
  return (entry?.status as StageStatus) || 'pending';
};

const deriveGeneralStatus = (app: AdminApplicationDto): GeneralStatus => {
  const resultStatus = app.timeline.find(t => t.name === 'result')?.status;
  if (resultStatus === 'accepted' || resultStatus === 'completed') return 'Finalizado';
  const hasRejected = app.timeline.some(t => t.status === 'rejected');
  if (hasRejected || app.status?.toLowerCase() === 'discarded' || app.status?.toLowerCase() === 'descartado') return 'Descartado';
  return 'En Proceso';
};

const statusToClass = (status: string) => {
  switch (status) {
    case 'accepted':
    case 'completed':
      return 'tag tag-success';
    case 'scheduled':
    case 'in_progress':
      return 'tag tag-info';
    case 'rejected':
      return 'tag tag-danger';
    case 'pending':
    default:
      return 'tag tag-muted';
  }
};

const generalStatusToClass = (status: GeneralStatus) => {
  if (status === 'Finalizado') return 'tag tag-success';
  if (status === 'Descartado') return 'tag tag-danger';
  return 'tag tag-info';
};

const pageSizeOptions = [10, 25, 50] as const;

const Preselection: React.FC = () => {
  const [applications, setApplications] = useState<AdminApplicationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof pageSizeOptions[number]>(10);

  const [editObservationApp, setEditObservationApp] = useState<AdminApplicationDto | null>(null);
  const [observationStage, setObservationStage] = useState<StageName>('result');
  const [observationText, setObservationText] = useState<string>('');
  const [editModalApp, setEditModalApp] = useState<AdminApplicationDto | null>(null);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStage, setBulkStage] = useState<StageName>('application');
  const [bulkStatus, setBulkStatus] = useState<StageStatus>('scheduled');

  const [filters, setFilters] = useState<{
    generalStatus: 'Todos' | GeneralStatus;
    jobTitle: 'Todos' | string;
    stageStatuses: Partial<Record<StageName, 'Todos' | StageStatus>>;
    similarityOrder: 'none' | 'best' | 'worst';
  }>({
    generalStatus: 'Todos',
    jobTitle: 'Todos',
    stageStatuses: {
      application: 'Todos',
      preselection: 'Todos',
      interview: 'Todos',
      test: 'Todos',
      result: 'Todos',
    },
    similarityOrder: 'none',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listApplications();
      setApplications(data);
    } catch (e) {
      setError('No se pudieron cargar las aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetSelection = () => setSelectedIds(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byQuery = (app: AdminApplicationDto) => {
      if (!q) return true;
      const name = app.user?.name?.toLowerCase() || '';
      const email = app.user?.email?.toLowerCase() || '';
      const job = app.job?.title_job?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || job.includes(q);
    };

    const byGeneral = (app: AdminApplicationDto) => {
      if (filters.generalStatus === 'Todos') return true;
      return deriveGeneralStatus(app) === filters.generalStatus;
    };

    const byJob = (app: AdminApplicationDto) => {
      if (filters.jobTitle === 'Todos') return true;
      return (app.job?.title_job || '') === filters.jobTitle;
    };

    const byStages = (app: AdminApplicationDto) => {
      return stageOptions.every(stage => {
        const wanted = filters.stageStatuses[stage];
        if (!wanted || wanted === 'Todos') return true;
        return deriveStageStatus(app, stage) === wanted;
      });
    };

    const base = applications.filter(app => byQuery(app) && byGeneral(app) && byJob(app) && byStages(app));
    if (filters.similarityOrder === 'best') {
      return [...base].sort((a, b) => ((b as any).similarity_percent ?? -1) - ((a as any).similarity_percent ?? -1));
    }
    if (filters.similarityOrder === 'worst') {
      return [...base].sort((a, b) => ((a as any).similarity_percent ?? 9999) - ((b as any).similarity_percent ?? 9999));
    }
    return base;
  }, [applications, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    // Reset to first page whenever filters/search change
    setPage(1);
  }, [search, filters, pageSize]);

  const toggleSelectAllCurrentPage = () => {
    const ids = currentPageItems.map(a => a.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      ids.forEach(id => next.delete(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openEditModal = (app: AdminApplicationDto) => {
    setEditModalApp(app);
  };

  const saveEditModal = async (updatedStages: Record<StageName, StageStatus>) => {
    if (!editModalApp) return;
    try {
      setLoading(true);
      for (const stage of stageOptions) {
        const newStatus = updatedStages[stage];
        await adminService.updateStage(editModalApp.id, { name: stage, status: newStatus });
      }
      await load();
      setEditModalApp(null);
    } catch (e) {
      alert('No se pudieron guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const applyBulkStageChange = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await adminService.updateStage(id, { name: bulkStage, status: bulkStatus });
      }
      await load();
      setBulkModalOpen(false);
      resetSelection();
    } catch (e) {
      alert('No se pudo aplicar el cambio masivo');
    } finally {
      setLoading(false);
    }
  };

  const discardSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm('¿Descartar candidatos seleccionados?')) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await adminService.updateStage(id, { name: 'preselection', status: 'rejected' });
        await adminService.updateStage(id, { name: 'result', status: 'rejected' });
      }
      await load();
      resetSelection();
    } catch (e) {
      alert('No se pudo descartar la selección');
    } finally {
      setLoading(false);
    }
  };

  const removeFromUI = (id: number) => {
    // UI-only removal from current list
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const openObservation = (app: AdminApplicationDto, stage: StageName) => {
    setEditObservationApp(app);
    setObservationStage(stage);
    const existing = app.timeline.find(t => t.name === stage)?.feedback || '';
    setObservationText(existing || '');
  };

  const saveObservation = async () => {
    if (!editObservationApp) return;
    try {
      setLoading(true);
      const stageName = observationStage;
      await adminService.updateStage(editObservationApp.id, { name: stageName, status: deriveStageStatus(editObservationApp, stageName), feedback: observationText });
      await load();
      setEditObservationApp(null);
      setObservationText('');
    } catch (e) {
      alert('No se pudo guardar la observación');
    } finally {
      setLoading(false);
    }
  };

  const uniqueJobTitles = useMemo(() => {
    const setTitles = new Set<string>();
    applications.forEach(a => { if (a.job?.title_job) setTitles.add(a.job.title_job); });
    return ['Todos', ...Array.from(setTitles)] as Array<'Todos' | string>;
  }, [applications]);

  return (
    <div className="preselection-page">
      <div className="preselection-header">
        <h1>Sistema de preselección</h1>
        <p className="subtitle">Gestiona candidatos a escala con búsqueda, filtros y acciones masivas</p>
      </div>

      {!!error && !loading && (
        <div className="bulk-actions-bar" style={{ marginBottom: 12 }}>
          <div className="bulk-count">{error}</div>
          <button className="btn-ghost" onClick={() => setError('')}>Ocultar</button>
        </div>
      )}

      <div className="data-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por candidato, correo o vacante..."
          />
        </div>
        <button className="btn-secondary" onClick={() => setShowFilters(true)}>
          <Filter size={16} /> Filtros avanzados
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-count">{selectedIds.size} seleccionados</div>
          <div className="bulk-actions">
            <button className="btn-secondary" onClick={() => setBulkModalOpen(true)}>Cambiar estatus de etapa…</button>
            <button className="btn-danger" onClick={discardSelected}>Descartar seleccionados</button>
            <button className="btn-ghost" onClick={resetSelection}>Limpiar selección</button>
          </div>
        </div>
      )}

      <div className="data-table">
        <div className="data-table-header">
          <div className="th checkbox">
            <input
              type="checkbox"
              aria-label="Seleccionar todos"
              checked={currentPageItems.every(a => selectedIds.has(a.id)) && currentPageItems.length > 0}
              onChange={toggleSelectAllCurrentPage}
            />
          </div>
          <div className="th">Vacante</div>
          <div className="th">Candidato</div>
          <div className="th">Estatus General</div>
          <div className="th">Progreso por etapas</div>
          <div className="th" style={{ minWidth: 120 }}>Similitud</div>
          <div className="th actions">Acciones</div>
        </div>

        <div className="data-table-body">
          {loading && <div className="table-loading">Cargando…</div>}
          {!loading && currentPageItems.length === 0 && (
            <div className="table-empty">Sin resultados</div>
          )}
          {!loading && currentPageItems.map((app) => {
            const general = deriveGeneralStatus(app);
            return (
              <div key={app.id} className="tr">
                <div className="td checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => toggleSelectOne(app.id)}
                    aria-label={`Seleccionar candidato ${app.user?.name || app.user?.email || app.id}`}
                  />
                </div>
                <div className="td">
                  <div className="cell-title">{app.job?.title_job || '—'}</div>
                </div>
                <div className="td">
                  <div className="cell-title">{app.user?.name || 'Sin nombre'}</div>
                  <div className="cell-subtitle">{app.user?.email || '—'}</div>
                </div>
                <div className="td">
                  <span className={generalStatusToClass(general)}>{general}</span>
                </div>
                <div className="td">
                  <div className="stages-inline">
                    {stageOptions.map(stage => (
                      <div key={stage} className="stage-tag">
                        <span className="stage-label">{stageLabel[stage]}</span>
                        <span
                          className={statusToClass(deriveStageStatus(app, stage))}
                          title={stage === 'result' ? 'Editar observación' : stage === 'interview' ? 'Enlace de la reunión' : stage === 'test' ? 'Enlace del test' : undefined}
                          onClick={(stage === 'result' || stage === 'interview' || stage === 'test') ? () => openObservation(app, stage) : undefined}
                          style={(stage === 'result' || stage === 'interview' || stage === 'test') ? { cursor: 'pointer' } : undefined}
                        >
                          {deriveStageStatus(app, stage)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="td"><span className="tag">{(app as any).similarity_percent ?? '—'}%</span></div>
                <div className="td actions">
                  <div className="actions-wrapper" onClick={(e) => { e.stopPropagation(); }}>
                    <button className="btn-icon" title="Editar etapas" onClick={() => openEditModal(app)}>
                      <Pencil size={18} />
                    </button>
                    <button className="btn-icon danger" title="Eliminar de la vista" onClick={() => removeFromUI(app.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="data-table-footer">
        <div className="page-size">
          <label>Mostrar</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) as typeof pageSizeOptions[number])}>
            {pageSizeOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span>por página</span>
        </div>
        <div className="pagination">
          <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="drawer-overlay" onClick={() => setShowFilters(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Filtros avanzados</h3>
              <button className="btn-icon" onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>
            <div className="drawer-content">
              <div className="form-row">
                <label>Estatus general</label>
                <select
                  value={filters.generalStatus}
                  onChange={(e) => setFilters(f => ({ ...f, generalStatus: e.target.value as any }))}
                >
                  {(['Todos', 'En Proceso', 'Finalizado', 'Descartado'] as const).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Vacante</label>
                <select
                  value={filters.jobTitle}
                  onChange={(e) => setFilters(f => ({ ...f, jobTitle: e.target.value as any }))}
                >
                  {uniqueJobTitles.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Orden por similitud</label>
                <select
                  value={filters.similarityOrder}
                  onChange={(e) => setFilters(f => ({ ...f, similarityOrder: e.target.value as any }))}
                >
                  <option value="none">Sin ordenar</option>
                  <option value="best">Mejores porcentajes</option>
                  <option value="worst">Peores porcentajes</option>
                </select>
              </div>
              <div className="form-row">
                <label>Estados por etapa</label>
                <div className="stages-filters">
                  {stageOptions.map(s => (
                    <div key={s} className="stage-filter-item">
                      <span className="stage-label">{stageLabel[s]}</span>
                      <select
                        value={filters.stageStatuses[s] || 'Todos'}
                        onChange={(e) => setFilters(f => ({ ...f, stageStatuses: { ...f.stageStatuses, [s]: e.target.value as any } }))}
                      >
                        {(['Todos', ...statusOptions] as const).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn-outline" onClick={() => setFilters({
                generalStatus: 'Todos',
                jobTitle: 'Todos',
                stageStatuses: { application: 'Todos', preselection: 'Todos', interview: 'Todos', test: 'Todos', result: 'Todos' },
                similarityOrder: 'none'
              })}>Limpiar</button>
              <button className="btn-gradient" onClick={() => setShowFilters(false)}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {editModalApp && (
        <EditStatusModal
          application={editModalApp}
          onClose={() => setEditModalApp(null)}
          onSave={saveEditModal}
        />)
      }

      {bulkModalOpen && (
        <div className="modal-overlay" onClick={() => setBulkModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cambiar estatus de etapa (masivo)</h3>
              <button className="btn-icon" onClick={() => setBulkModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <label>Etapa</label>
                <select value={bulkStage} onChange={(e) => setBulkStage(e.target.value as StageName)}>
                  {stageOptions.map(s => <option key={s} value={s}>{stageLabel[s]}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Nuevo estatus</label>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as StageStatus)}>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setBulkModalOpen(false)}>Cancelar</button>
              <button className="btn-gradient" onClick={applyBulkStageChange}>Aplicar a seleccionados</button>
            </div>
          </div>
        </div>
      )}

      {editObservationApp && (
        <div className="modal-overlay" onClick={() => setEditObservationApp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{observationStage === 'result' ? 'Observación final' : observationStage === 'interview' ? 'Enlace de la reunión' : observationStage === 'test' ? 'Enlace del test' : 'Observación'}</h3>
              <button className="btn-icon" onClick={() => setEditObservationApp(null)}><X size={18} /></button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <label>{observationStage === 'result' ? 'Mensaje para el candidato' : observationStage === 'interview' ? 'Pega el enlace de la reunión (Zoom/Meet)' : 'Pega el enlace del test'}</label>
                <textarea rows={4} value={observationText} onChange={(e) => setObservationText(e.target.value)} placeholder={observationStage === 'result' ? 'Escribe la observación de resultado...' : 'https://...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setEditObservationApp(null)}>Cancelar</button>
              <button className="btn-gradient" onClick={saveObservation}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditStatusModal: React.FC<{
  application: AdminApplicationDto;
  onClose: () => void;
  onSave: (updatedStages: Record<StageName, StageStatus>) => void;
}> = ({ application, onClose, onSave }) => {
  const [local, setLocal] = useState<Record<StageName, StageStatus>>({
    application: deriveStageStatus(application, 'application') as StageStatus,
    preselection: deriveStageStatus(application, 'preselection') as StageStatus,
    interview: deriveStageStatus(application, 'interview') as StageStatus,
    test: deriveStageStatus(application, 'test') as StageStatus,
    result: deriveStageStatus(application, 'result') as StageStatus,
  });

  const handleChange = (stage: StageName, value: StageStatus) => {
    setLocal(prev => ({ ...prev, [stage]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Actualizar estatus</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-content">
          {stageOptions.map(stage => (
            <div key={stage} className="form-row">
              <label>{stageLabel[stage]}</label>
              <select value={local[stage]} onChange={(e) => handleChange(stage, e.target.value as StageStatus)}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-gradient" onClick={() => onSave(local)}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
};

export default Preselection;

