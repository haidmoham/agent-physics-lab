import './style.css';
import { ExperimentController } from './experiment.js';
import { mountUI } from './ui.js';
import { registerWebMCPTools } from './webmcp.js';

const controller = new ExperimentController();
const ui = mountUI(document.querySelector('#app'), controller);

registerWebMCPTools(controller)
  .then((status) => ui.setWebMCPStatus(status))
  .catch((error) => {
    console.error('WebMCP registration failed', error);
    ui.setWebMCPStatus({ supported: false, registered: 0 });
  });
