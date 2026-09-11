import { env } from "@huggingface/transformers";

console.log("[MUDI DEBUG] Env object keys:", Object.keys(env));
console.log("[MUDI DEBUG] Env backends:", env.backends);
console.log("[MUDI DEBUG] WASM backend config:", env.backends?.onnx?.wasm);
