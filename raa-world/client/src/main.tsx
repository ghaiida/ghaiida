import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import '@fontsource/tajawal/arabic-400.css';
import '@fontsource/tajawal/arabic-500.css';
import '@fontsource/tajawal/arabic-700.css';
import '@fontsource/tajawal/arabic-800.css';
import '@fontsource/tajawal/latin-400.css';
import '@fontsource/tajawal/latin-700.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/latin-700.css';
import './styles/app.css';
import { AuthProvider, RequireAuth } from './auth.tsx';
import { FeedbackProvider, Spinner } from './ui/kit.tsx';
import { Landing } from './pages/Landing.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { NotFound } from './pages/NotFound.tsx';

// The editor, results and player are split into their own chunks.
const EditorPage = lazy(() => import('./editor/EditorPage.tsx'));
const ResultsPage = lazy(() => import('./pages/ResultsPage.tsx'));
const PlayPage = lazy(() => import('./pages/PlayPage.tsx'));

function Root() {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </FeedbackProvider>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
      { path: '/dashboard', element: <RequireAuth><Dashboard /></RequireAuth> },
      { path: '/games/:id/edit/:step?', element: <RequireAuth><EditorPage /></RequireAuth> },
      { path: '/games/:id/results', element: <RequireAuth><ResultsPage /></RequireAuth> },
      { path: '/play/:id', element: <PlayPage /> },
      { path: '/demo/:sample', element: <PlayPage demo /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
