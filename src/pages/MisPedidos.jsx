import { useNavigate } from 'react-router-dom';
import { usePedidos } from '../context/PedidosContext';
import './MisPedidos.css';

const MisPedidos = () => {
  const { pedidos } = usePedidos();
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      'Pedido Creado': { bg: 'bg-cyan-400', text: 'text-cyan-900', border: 'border-cyan-500' },
      'Pedido Pendiente': { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500' },
      'Pedido Preparado': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
      'Pedido Enviado': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
      'Pedido Recibido': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' }
    };
    return colors[status] || colors['Pedido Creado'];
  };

  const getProgressPercentage = (status) => {
    const estados = ['Pedido Creado', 'Pedido Pendiente', 'Pedido Preparado', 'Pedido Enviado', 'Pedido Recibido'];
    const index = estados.indexOf(status);
    return ((index + 1) / estados.length) * 100;
  };

  const formatFechaISO = (isoString) => {
    if (!isoString) return '';
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return '';
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Usa fecha ISO si existe, si no toma la del primer historial
  const obtenerFechaMostrar = (pedido) => {
    const desdeISO = formatFechaISO(pedido.fecha);
    if (desdeISO) return desdeISO;

    if (pedido.historialEstados && pedido.historialEstados.length > 0) {
      return pedido.historialEstados[0].fecha || '';
    }

    return '';
  };

  // Calcula el total del pedido sumando sus ítems
  const calcularTotalPedido = (pedido) => {
    if (!pedido.items || !Array.isArray(pedido.items)) return 0;

    const total = pedido.items.reduce((acc, item) => {
      const cantidad = item.cantidad ?? item.quantity ?? 1;
      const precioUnitario = Number(item.precio ?? 0);
      return acc + precioUnitario * cantidad;
    }, 0);

    return Number(total.toFixed(2));
  };

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="mis-pedidos-page">
        <div className="container-pedidos">
          <div className="empty-pedidos">
            <div className="empty-icon">📦</div>
            <h2>No tienes pedidos aún</h2>
            <p>¡Realiza tu primer pedido desde nuestra carta!</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/menu')}
            >
              Ver Carta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-pedidos-page">
      <div className="container-pedidos">
        <div className="pedidos-list">
          {pedidos.map((pedido) => {
            const statusColor = getStatusColor(pedido.status);
            const progreso = getProgressPercentage(pedido.status);
            const fechaMostrar = obtenerFechaMostrar(pedido);
            const totalPedido = calcularTotalPedido(pedido);

            return (
              <div key={pedido.id} className="pedido-card">
                {/* Header del Pedido */}
                <div className="pedido-header">
                  <div className="pedido-info">
                    <h3 className="pedido-id">Pedido #{pedido.id}</h3>
                    {fechaMostrar && (
                      <p className="pedido-fecha">
                        📅 {fechaMostrar}
                      </p>
                    )}
                    <p className="pedido-sede">
                      🍗 {pedido.sede}
                    </p>
                    <p className="pedido-direccion">
                      📍 {pedido.direccion}
                    </p>
                  </div>

                  <div className="pedido-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">
                      S/ {totalPedido.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Estado Actual */}
                <div className="pedido-status-section">
                  <div className={`status-badge ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                    <span className="status-icon">
                      {pedido.status === 'Pedido Recibido' ? '✅' : '🕐'}
                    </span>
                    <span className="status-text">{pedido.status}</span>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progreso.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Productos del Pedido */}
                <div className="pedido-productos">
                  <h4 className="productos-title">Productos:</h4>
                  <div className="productos-list">
                    {pedido.items.map((item, index) => {
                      const cantidad = item.cantidad ?? item.quantity ?? 1;
                      const precioUnitario = Number(item.precio ?? 0);

                      return (
                        <div key={index} className="producto-item">
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="producto-img"
                          />
                          <div className="producto-info">
                            <p className="producto-nombre">{item.nombre}</p>
                            <p className="producto-cantidad">x{cantidad}</p>
                          </div>
                          <span className="producto-precio">
                            S/ {(precioUnitario * cantidad).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historial de Estados */}
                <details className="historial-estados">
                  <summary className="historial-toggle">
                    📋 Ver historial de estados
                  </summary>
                  <div className="historial-content">
                    <div className="timeline">
                      {pedido.historialEstados?.map((historial, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <p className="timeline-estado">{historial.estado}</p>
                            <p className="timeline-fecha">{historial.fecha}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>

        {/* Botón para hacer nuevo pedido */}
        <div className="action-buttons">
          <button
            className="btn-nuevo-pedido"
            onClick={() => navigate('/menu')}
          >
            Realizar Nuevo Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
