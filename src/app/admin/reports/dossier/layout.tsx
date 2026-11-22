import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faculty Evaluation Dossier | KIET Academic Intelligence',
  description: 'Official A4 Printable Faculty Evaluation Dossiers with 10-criteria rubrics, comparative metrics, and academic feedback.',
};

export default function DossierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
