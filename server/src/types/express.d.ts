declare module "express" {
  import { Server as HttpServer } from "http";
  import { Server as SocketIOServer } from "socket.io";

  export interface Request {
    body: any;
    params: any;
    query: any;
  }

  export interface Response {
    status(code: number): Response;
    json(data: any): Response;
    send(data: any): Response;
  }

  export interface Application {
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    use(middleware: any): void;
    listen(port: number, callback?: () => void): HttpServer;
  }

  export function express(): Application;
}
