import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { RootLayout } from './layout'
import { routes } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense>
                  <route.page />
                </Suspense>
              }
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
