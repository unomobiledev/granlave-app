import type { OSDetalhe } from "./os-detalhe";

export function mockBuscarOSPorCodigo(
  codOs: string | number,
  codAtendimento: string | number,
): OSDetalhe {
  const codStr = String(codOs);
  return {
    codOs,
    codAtendimento: Number(codAtendimento) || 1,
    numero: codStr.startsWith("OS-") ? codStr : `OS-${codStr}`,
    status: "4 - Em atendimento",
    codStatus: 4,
    descStatus: "Em atendimento",
    descAbrevStatus: "Em atendimento",
    nomeCliente: "Cliente Mock LTDA",
    cliente: { nome: "Cliente Mock LTDA", razaoSocial: "Cliente Mock LTDA" },
    codCliente: 999,
    placa: "MCK-0M00",
    dtAbertura: new Date(Date.now() - 2 * 3600_000).toISOString(),
    dtComprometida: new Date(Date.now() + 4 * 3600_000).toISOString(),
    dtPrevisaoConclusao: new Date(Date.now() + 4 * 3600_000).toISOString(),
    nomeContato: "Motorista Mock",
    ddd: "15",
    telefone: "99999-9999",
    categoria: "1 - HIGIENIZAÇÃO",
    descricaoCategoria: "HIGIENIZAÇÃO",
    nomeResponsavel: "Operador Mock",
  } as OSDetalhe;
}