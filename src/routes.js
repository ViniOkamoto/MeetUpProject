import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import SubscriptionController from './app/controllers/SubscriptionController';
import MeetupController from './app/controllers/MeetupController';
import FileController from './app/controllers/FileController';

import authMiddleware from './app/middlewares/auth';
import NotificationController from './app/controllers/NotificationController';
import OrganizingController from './app/controllers/OrganizingController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.post('/files', upload.single('file'), FileController.store);
routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);

routes.get('/organizing', OrganizingController.index);

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/meetups/:meetupId/subscriptions', SubscriptionController.store);

export default routes;
