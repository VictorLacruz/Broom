import { loadGameData } from "./game/DataLoader";
import { BroomGame } from "./game/Game";
import "./ui/styles.css";

const mount = document.getElementById("app");
if (!mount) {
  throw new Error("No se encontro #app");
}

loadGameData()
  .then((data) => {
    new BroomGame(mount, data);
  })
  .catch((error) => {
    console.error(error);
    mount.innerHTML = `<pre style="color:#fff;padding:16px;">Error al cargar datos JSON: ${String(error)}</pre>`;
  });
