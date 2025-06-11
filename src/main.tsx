import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './main.css'
import PlayerScreen from '@/pages/PlayerScreen'
import CreateRoomScreen from '@/pages/CreateRoom'
import JoinRoomHandler from '@/pages/JoinRoomHandler'

const router = createBrowserRouter([
  {
    path: '/',
    element: <PlayerScreen />,
  },
  {
    path: '/create-room',
    element: <CreateRoomScreen />,
  },
  {
    path: '/join-room',
    element: <JoinRoomHandler />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
