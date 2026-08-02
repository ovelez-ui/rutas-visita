import { Link } from 'react-router-dom';
import { PageTitle, Card } from '../components/ui';
import { IconGo } from '../components/icons';
import { NAV_SECUNDARIO } from '../components/Layout';

const DESCRIPCIONES: Record<string, string> = {
  '/tiendas': 'Crear, editar e importar puntos de venta',
  '/reporte': 'Consolidado de visitas con fotos y observaciones',
  '/presentacion': 'Pase de diapositivas del día generado con IA',
  '/config': 'Preferencias, generación de rutas y cuenta',
};

export default function Mas() {
  return (
    <div>
      <PageTitle title="Más" subtitle="Otras secciones y ajustes" />
      <div className="space-y-2.5">
        {NAV_SECUNDARIO.map(({ to, label, Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-brand-300">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{DESCRIPCIONES[to]}</div>
                </div>
              </div>
              <IconGo className="h-5 w-5 text-slate-400" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
