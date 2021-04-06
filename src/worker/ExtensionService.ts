export class ExtensionService {
  constructor(sock: any) {
    sock.on('message', function(data: string) {
      console.info(data)
    });
    sock.on('close', function() {});
  }
}