import { MapController } from 'react-map-gl';

export default class MyMapController extends MapController {
  constructor() {
    super();
    // subscribe to additional events
    this.events = ['click'];
  }

  // Override the default handler in MapController
  handleEvent(event: any) {
    if (event.type === 'click') {
      console.log('hi');
    }
    console.log(event.type);
    return super.handleEvent(event);
  }
}
