create table conta (
    id bigserial primary key,
    nome varchar(100) not null,
    saldo_inicial numeric(12, 2) not null,
    tipo varchar(255) not null,
    arquivada boolean default false
);

create table categoria (
    id bigserial primary key,
    nome varchar(100) not null,
    tipo varchar(255) not null
);

create table transacao_recorrente (
    id bigserial primary key,
    descricao varchar(150) not null,
    valor numeric(12, 2) not null,
    tipo varchar(255) not null,
    frequencia varchar(255) not null,
    dia_do_mes integer,
    data_inicio date not null,
    data_fim date,
    ativa boolean not null,
    conta_id bigint not null references conta(id),
    categoria_id bigint not null references categoria(id)
);

create table transacao (
    id bigserial primary key,
    descricao varchar(150) not null,
    valor numeric(12, 2) not null,
    data date not null,
    tipo varchar(255) not null,
    conta_id bigint not null references conta(id),
    categoria_id bigint references categoria(id),
    recorrencia_id bigint references transacao_recorrente(id),
    natureza varchar(255),
    constraint uk_transacao_recorrencia_data unique (recorrencia_id, data)
);

create table orcamento_categoria (
    id bigserial primary key,
    categoria_id bigint not null references categoria(id),
    mes_referencia date not null,
    valor_limite numeric(19, 2) not null,
    constraint uk_orcamento_categoria_mes unique (categoria_id, mes_referencia)
);

create table cartao_credito (
    id bigserial primary key,
    nome varchar(80) not null,
    bandeira varchar(30) not null,
    final_cartao varchar(4) not null,
    limite_total numeric(12, 2) not null,
    dia_fechamento integer not null,
    dia_vencimento integer not null,
    conta_pagamento_id bigint not null references conta(id)
);

create table compra_cartao (
    id bigserial primary key,
    descricao varchar(150) not null,
    valor_total numeric(12, 2) not null,
    data_compra date not null,
    numero_parcelas integer not null,
    cartao_id bigint not null references cartao_credito(id),
    categoria_id bigint not null references categoria(id)
);

create table pagamento_fatura (
    id bigserial primary key,
    cartao_id bigint not null references cartao_credito(id),
    mes_referencia date not null,
    valor_pago numeric(12, 2) not null,
    data_pagamento date not null,
    transacao_id bigint not null unique references transacao(id),
    constraint uk_pagamento_fatura_cartao_mes unique (cartao_id, mes_referencia)
);

create index idx_transacao_conta_data on transacao (conta_id, data desc);
create index idx_transacao_categoria_data on transacao (categoria_id, data);
create index idx_recorrencia_conta on transacao_recorrente (conta_id);
create index idx_compra_cartao_data on compra_cartao (cartao_id, data_compra desc);
create index idx_compra_categoria_data on compra_cartao (categoria_id, data_compra);
