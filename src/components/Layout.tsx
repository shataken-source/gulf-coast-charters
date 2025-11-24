import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  session?: any;
}

export default function Layout({ children, session }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
