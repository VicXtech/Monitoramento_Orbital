import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Componente de Barreira de Erros (React Error Boundary)
 * Previne que exceções de renderização em componentes filhos derrubem
 * a aplicação inteira para uma tela preta, mantendo o globo 3D e o console operacionais.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false, erro: null };
  }

  static getDerivedStateFromError(error) {
    return { temErro: true, erro: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[OrbitalED ErrorBoundary] Falha capturada no componente:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ temErro: false, erro: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.temErro) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '16px',
            margin: '12px',
            background: 'rgba(255, 0, 85, 0.15)',
            border: '1px solid var(--neon-red, #ff0055)',
            borderRadius: '10px',
            color: '#fff',
            fontFamily: 'var(--font-tech, monospace)',
            backdropFilter: 'blur(10px)',
            maxWidth: '500px',
            zIndex: 9999
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="var(--neon-red, #ff0055)" />
            <strong style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>
              RECUPERAÇÃO DE SUBSISTEMA
            </strong>
          </div>
          <p style={{ fontSize: '0.78rem', opacity: 0.85, margin: '0 0 12px 0', lineHeight: 1.4 }}>
            O módulo {this.props.nomeModulo || 'do HUD'} encontrou uma instabilidade temporária. Os dados orbitais e a navegação permanecem íntegros.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            Restabelecer Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
