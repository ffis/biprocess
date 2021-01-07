import requireDirectory = require("require-directory");
import { Libraries } from "../types";

const libs: Libraries = (requireDirectory(module) as unknown) as Libraries;

export default libs;
