import { http, HttpResponse } from 'msw';
import { flows } from './fixtures/flows';

export const handlers = [
  http.get('/api/flows/:id/trace', ({ params }) => {
    const flow = flows.find((f) => f.id === Number(params.id));
    if (!flow) {
      return HttpResponse.json({ error: 'Flow not found' }, { status: 404 });
    }
    return HttpResponse.json({
      flowId: flow.id,
      results: [],
    });
  }),
];
