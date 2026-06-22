// cPanel / Passenger startup wrapper.
// Many cPanel "Setup Node.js App" setups expect the startup file at the project
// root. This simply launches the real server (server/src/index.js), which serves
// both the website (the built dist/ folder) and the /api backend.
import('./server/src/index.js');
