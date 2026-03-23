import { useNavigate } from "react-router-dom";
import CarouselV2 from "../../componentes/carousel/CarouselV2";
import { ImagenProductos } from "../../configuracion/apiUrls";

const CardLote = ({ lote, esMiSucursal = false }) => {
    const navigate = useNavigate();

    const imagenes = lote.Producto?.ImagenProductos?.length > 0
        ? lote.Producto.ImagenProductos.map(img => ImagenProductos + img.imagen)
        : ["/producto_default.jpeg"];

    // --- CALCULAR DÍAS PARA VENCER ---
    const hoy = new Date();
    const fechaVenc = new Date(lote.fechaVencimiento);
    const diasParaVencer = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
    const estaVencido = diasParaVencer < 0;
    const proximoAVencer = diasParaVencer >= 0 && diasParaVencer <= 30;

    const colorVencimiento = estaVencido ? "#dc2626" : proximoAVencer ? "#d97706" : "#16a34a";
    const textoVencimiento = estaVencido
        ? `Vencido hace ${Math.abs(diasParaVencer)} día(s)`
        : diasParaVencer === 0
            ? "Vence hoy"
            : `Vence en ${diasParaVencer} día(s)`;

    return (
        <>
            <style>{`
    .lc-card { border-radius: 14px; border: 1.5px solid #e2e8f0; background: #fff; transition: box-shadow .2s; height: 100%; display: flex; flex-direction: column; isolation: isolate; }
    .lc-card:not(.inactivo):not(.otra-sucursal):hover { box-shadow: 0 8px 28px rgba(0,0,0,.1); }
    .lc-card.inactivo { opacity: .7; filter: grayscale(30%); }
    .lc-card.otra-sucursal { border-color: #fde68a; background: #fffbeb; }
    .lc-img-wrap { position: relative; height: 180px; background: #f8fafc; overflow: hidden; flex-shrink: 0; border-radius: 12px 12px 0 0; }
    .lc-img-wrap .carousel, .lc-img-wrap .carousel-inner, .lc-img-wrap .carousel-item { height: 100%; }
    .lc-img-wrap .carousel-item img { width: 100%; height: 180px; object-fit: cover; }
   .lc-badge-estado { position: absolute; top: 8px; left: 8px; z-index: 10; font-size: .62rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; letter-spacing: .04em; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
.lc-badge-sucursal { position: absolute; top: 8px; right: 8px; z-index: 10; font-size: .62rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: #fde68a; color: #92400e; }
    .lc-body { padding: 12px 14px 14px; display: flex; flex-direction: column; flex: 1; }
    .lc-producto { font-size: .95rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
    .lc-lote { font-size: .72rem; font-family: monospace; background: #f1f5f9; color: #475569; padding: 2px 7px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
    .lc-meta { font-size: .78rem; color: #64748b; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    .lc-meta i { width: 13px; text-align: center; color: #94a3b8; }
    .lc-vencimiento { font-size: .75rem; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 5px; }
    .lc-actions { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
    .lc-btn-editar { flex: 1; background: #fef3c7; color: #b45309; border: 1px solid #fde68a; border-radius: 8px; font-size: .78rem; font-weight: 600; padding: 6px 0; cursor: pointer; transition: background .15s; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .lc-btn-editar:hover { background: #fde68a; }
    .lc-readonly { flex: 1; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .78rem; font-weight: 600; padding: 6px 0; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: default; }
`}</style>

            <div className={`lc-card${lote.estado === "Inactivo" ? " inactivo" : ""}${!esMiSucursal ? " otra-sucursal" : ""}`}>

                <div style={{ position: "relative", height: 0 }}>
                    <span className={`lc-badge-estado badge ${lote.estado === "Activo" ? "bg-success" : "bg-secondary"}`}>
                        {lote.estado}
                    </span>
                    {!esMiSucursal && (
                        <span className="lc-badge-sucursal">
                            <i className="fas fa-store mr-1" /> Otra sucursal
                        </span>
                    )}
                </div>

                {/* --- IMÁGENES (carrusel) --- */}
                <div className="lc-img-wrap">
                    <CarouselV2
                        id={`carouselLote${lote.id}`}
                        datos={imagenes.map(url => ({ url, nombre: lote.Producto?.nombre || "Producto" }))}
                    />
                </div>
                {/* --- BODY --- */}
                <div className="lc-body">
                    <div className="lc-producto" title={lote.Producto?.nombre}>
                        {lote.Producto?.nombre || "—"}
                    </div>
                    <span className="lc-lote">{lote.numeroLote}</span>

                    <div className="lc-meta">
                        <i className="fas fa-boxes" />
                        <span>Cantidad: <strong>{lote.cantidadActual}</strong></span>
                    </div>
                    <div className="lc-meta">
                        <i className="fas fa-tag" />
                        <span>Costo: <strong>L. {Number(lote.costoUnitario).toFixed(2)}</strong></span>
                    </div>
                    {lote.Producto?.sku && (
                        <div className="lc-meta">
                            <i className="fas fa-barcode" />
                            <span>SKU: {lote.Producto.sku}</span>
                        </div>
                    )}
                    {lote.Producto?.CategoriaProducto?.Categoria && (
                        <div className="lc-meta">
                            <i className="fas fa-list" />
                            <span>{lote.Producto.CategoriaProducto.Categoria}</span>
                        </div>
                    )}

                    {/* --- VENCIMIENTO --- */}
                    <div className="lc-vencimiento" style={{ color: colorVencimiento }}>
                        <i className={`fas ${estaVencido ? "fa-exclamation-circle" : proximoAVencer ? "fa-exclamation-triangle" : "fa-calendar-check"}`} />
                        {textoVencimiento}
                    </div>

                    {/* --- ACCIONES --- */}
                    <div className="lc-actions">
                        {esMiSucursal ? (
                            <button
                                className="lc-btn-editar"
                                onClick={() => navigate(`/app/lotes/editar?id=${lote.id}`)}
                            >
                                <i className="fas fa-edit" /> Editar
                            </button>
                        ) : (
                            <div className="lc-readonly">
                                <i className="fas fa-eye" /> Solo lectura
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CardLote;