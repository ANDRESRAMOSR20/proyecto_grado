import React from 'react';
import { 
  Home,
  BriefcaseIcon,
  BarChart3,
  User,
  LogOut,
} from 'lucide-react';

type PageType = 'home' | 'preselection' | 'jobs' | 'metrics' | 'profile';

interface SidebarProps {
  isCollapsed?: boolean;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, currentPage, onPageChange, onLogout }) => {
  const navigationItems = [
    { 
      icon: Home, 
      label: 'Inicio', 
      active: currentPage === 'home',
      page: 'home' as PageType
    },
    { 
      icon: BarChart3,
      label: 'Métricas',
      active: currentPage === 'metrics',
      page: 'metrics' as PageType
    },
    { 
      icon: BriefcaseIcon, 
      label: 'Sistema de preselección',
      active: currentPage === 'preselection',
      page: 'preselection' as PageType
    },
    {
      icon: BriefcaseIcon,
      label: 'Publicar vacantes',
      active: currentPage === 'jobs',
      page: 'jobs' as PageType
    },
  ];

  const bottomItems = [
    { 
      icon: User, 
      label: 'Perfil', 
      active: currentPage === 'profile',
      page: 'profile' as PageType
    },
    { icon: LogOut, label: 'Cerrar sesión', active: false, isLogout: true },
  ];

  const handleNavClick = (page?: PageType, isLogout?: boolean) => {
    if (isLogout) {
      onLogout?.();
    } else if (page) {
      onPageChange(page);
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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

export default Sidebar; 