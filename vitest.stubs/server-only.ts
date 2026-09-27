// Stub pro pacote "server-only" dentro do Vitest. O pacote de verdade só
// funciona sob a condition "react-server" do Next — fora dela ele lança um
// erro de propósito. Aqui a gente troca por um módulo vazio (via alias no
// vitest.config.mts) só pra poder testar funções puras de arquivos que têm
// `import 'server-only'` no topo, sem precisar mockar isso em cada teste.
export {}
