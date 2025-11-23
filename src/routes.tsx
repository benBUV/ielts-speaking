import PracticePage from './pages/PracticePage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'IELTS Speaking Practice',
    path: '/ielts-speaking',
    element: <PracticePage />
  }
];

export default routes;