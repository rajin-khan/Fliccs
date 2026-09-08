import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
export function render(path) { return renderToString(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>); }
