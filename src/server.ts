import express, { NextFunction, Request, Response } from 'express';
import { CampaignService, DomainError } from './service.js';
import { InMemoryStore } from './store.js';

const app = express();
app.use(express.json({ limit: '32kb' }));

const store = new InMemoryStore();
const defects = new Set((process.env.INJECT_DEFECTS ?? '').split(',').map(value => value.trim()).filter(Boolean));
const service = new CampaignService(store, defects);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'campaign-integrity-mock' }));

app.post('/api/campaigns', (req, res, next) => {
  try {
    res.status(201).json(service.createCampaign(req.body ?? {}));
  } catch (error) { next(error); }
});

app.get('/api/campaigns/:id', (req, res, next) => {
  try { res.json(service.snapshot(req.params.id)); } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/pause', (req, res, next) => {
  try { res.status(202).json(service.requestStop(req.params.id, 'pause')); } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/cancel', (req, res, next) => {
  try { res.status(202).json(service.requestStop(req.params.id, 'cancel')); } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/confirm-stop', (req, res, next) => {
  try { res.json(service.confirmStop(req.params.id)); } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/resume', (req, res, next) => {
  try { res.json(service.resume(req.params.id)); } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/impressions', (req, res, next) => {
  try {
    const result = service.acceptImpression(req.params.id, req.body?.eventId);
    res.status(result.duplicate ? 200 : 202).json({ ...result.event, duplicate: result.duplicate });
  } catch (error) { next(error); }
});

app.post('/api/campaigns/:id/impressions/:eventId/process', (req, res, next) => {
  try { res.json(service.processImpression(req.params.id, req.params.eventId)); } catch (error) { next(error); }
});

app.get('/api/campaigns/:id/report', (req, res, next) => {
  try { res.json(service.report(req.params.id)); } catch (error) { next(error); }
});

app.get('/api/campaigns/:id/ledger', (req, res, next) => {
  try {
    const snapshot = service.snapshot(req.params.id);
    res.json({ campaignId: req.params.id, entries: snapshot.ledger, totalCents: snapshot.billedCents });
  } catch (error) { next(error); }
});

// Test-support endpoints are intentionally isolated under /__test__.
app.delete('/__test__/reset', (_req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  store.reset();
  res.status(204).end();
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof DomainError) {
    return res.status(error.statusCode).json({ error: error.code, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error.' });
});

const port = Number(process.env.PORT ?? 4173);
app.listen(port, '127.0.0.1', () => console.log(`Mock API listening on http://127.0.0.1:${port}`));
