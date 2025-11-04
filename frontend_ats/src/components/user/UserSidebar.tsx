import React from 'react';
import {
  Briefcase,
  ClipboardList,
  User,
  LogOut,
} from 'lucide-react';
import type { UserPageType } from '../../App';

interface UserSidebarProps {
  currentPage: UserPageType;
  onPageChange: (page: UserPageType) => void;
  onLogout?: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ currentPage, onPageChange, onLogout }) => {
  const navigationItems = [
    { 
      icon: Briefcase, 
      label: 'Ver ofertas',
      active: currentPage === 'offerView',
      page: 'offerView' as UserPageType
    },
    { 
      icon: ClipboardList, 
      label: 'Ver selección',
      active: currentPage === 'selectionView',
      page: 'selectionView' as UserPageType
    },
  ];

  const bottomItems = [
    { 
      icon: User, 
      label: 'Perfil', 
      active: currentPage === 'profile',
      page: 'profile' as UserPageType
    },
    { icon: LogOut, label: 'Cerrar sesión', active: false, isLogout: true },
  ];

  const handleNavClick = (page?: UserPageType, isLogout?: boolean) => {
    if (isLogout) {
      onLogout?.();
    } else if (page) {
      onPageChange(page);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-text">Talent</span>
          <span className="workspace-text">workspace</span>
          <div className="logo-icon">AI</div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navigationItems.map((item, index) => (
          <div key={index} className="nav-section">
            <div 
              className={`nav-item ${item.active ? 'active' : ''}`}
              onClick={() => handleNavClick(item.page)}
            >
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map((item, index) => (
          <div 
            key={index} 
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={() => handleNavClick(item.page, item.isLogout)}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSidebar;


