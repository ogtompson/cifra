create table usuario (
    id bigserial primary key,
    nome varchar(100) not null,
    email varchar(254) not null,
    senha_hash varchar(100) not null,
    criado_em timestamp with time zone not null,
    constraint uk_usuario_email unique (email)
);

create table sessao (
    id bigserial primary key,
    usuario_id bigint not null references usuario(id) on delete cascade,
    token_hash varchar(64) not null,
    criado_em timestamp with time zone not null,
    expira_em timestamp with time zone not null,
    constraint uk_sessao_token_hash unique (token_hash)
);

alter table conta add column usuario_id bigint references usuario(id);
alter table categoria add column usuario_id bigint references usuario(id);

create index idx_sessao_usuario on sessao (usuario_id);
create index idx_sessao_expiracao on sessao (expira_em);
create index idx_conta_usuario on conta (usuario_id);
create index idx_categoria_usuario on categoria (usuario_id);
