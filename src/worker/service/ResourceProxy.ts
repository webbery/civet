import {ImageService} from './ImageService'
import { MessagePipeline } from '../MessageTransfer'

export class ResourceProxy {
  constructor(pipeline: MessagePipeline) {
    this.imageService = new ImageService(pipeline)
  }
  private imageService: ImageService;
}