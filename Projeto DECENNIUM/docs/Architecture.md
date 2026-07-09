# ============================================================
# THE MAGNUS INSTITUTE
# MAGNUS FILES
#
# ARQUITETURA OFICIAL DO PROJETO
# Versão 1.0
# ============================================================

# Objetivo

Este documento define toda a arquitetura do Magnus Files.

Toda funcionalidade implementada no projeto deve seguir as regras descritas neste documento.

Nenhum sistema deve ser desenvolvido sem respeitar esta arquitetura.

---

# Filosofia do Projeto

Magnus Files não é apenas um site.

Ele representa o sistema interno utilizado pelo Instituto Magnus para catalogar investigações, pessoas, criaturas e eventos.

Toda informação armazenada no sistema é tratada como um arquivo oficial.

---

# Princípios

## 1. Uma responsabilidade por sistema

Cada módulo possui apenas uma responsabilidade.

Exemplo:

Engine

↓

Inicialização

Router

↓

Navegação

Menu

↓

Interface lateral

Database

↓

Persistência

Auth

↓

Autenticação

Character

↓

Dados do personagem

Case

↓

Dados do caso

---

## 2. Nenhuma informação duplicada

Um dado deve existir apenas uma vez.

Exemplo:

ERRADO

Personagem

↓

Ataque completo

↓

Personagem

↓

Mesmo ataque completo

CORRETO

Personagem

↓

ATK-000015

↓

Coleção attacks

↓

ATK-000015

---

## 3. Tudo possui um identificador permanente

Nenhuma entidade será identificada pelo nome.

Todos os registros possuem um ID único.

Exemplo

CHR-000001

CAS-000001

CRE-000001

ATK-000001

EFT-000001

---

## 4. O nome pode mudar

Como o sistema utiliza IDs permanentes,

o usuário poderá alterar:

Nome

Descrição

Foto

Título

Sem quebrar nenhuma referência.

---

## 5. Toda entidade possui histórico

Sempre que possível,

ações importantes serão registradas.

Exemplo

Criação

Atualização

Remoção

Mudança de status

Troca de proprietário

---

## 6. Separação entre Definição e Estado

O Magnus Files separa:

Definição

↓

O que uma entidade É.

Estado

↓

Como ela está agora.

Exemplo

Ataque

↓

Nome

Descrição

Energia

Dano

Tipo

Personagem

↓

Possui

↓

ATK-000013

---

## 7. A Interface nunca contém regras

Toda regra pertence ao sistema.

A interface apenas apresenta dados.

Exemplo

ERRADO

Botão calcula dano.

CERTO

Sistema de combate calcula.

Interface apenas mostra.

---

# Organização Geral

Magnus Files

↓

Engine

↓

Application

↓

Database

↓

Interface

↓

Models

↓

Assets

---

# Organização do Banco

users/

characters/

creatures/

attacks/

abilities/

effects/

cases/

battles/

items/

notes/

audios/

media/

settings/

logs/

---

# Convenção de IDs

USR

Usuário

CHR

Personagem

CRE

Criatura

CAS

Caso

ATK

Ataque

ABL

Habilidade

EFT

Efeito

BTL

Batalha

ITM

Item

AUD

Áudio

MED

Arquivo

LOG

Registro

---

# Convenção de Datas

Todas as datas serão armazenadas em UTC.

A interface será responsável pela conversão para o horário local.

---

# Convenção de Referências

Nenhuma entidade armazena outra entidade completa.

Sempre utilizar IDs.

Exemplo

Personagem

↓

Ataques

↓

ATK-000014

ATK-000087

Nunca:

Nome

Descrição

Dano

Energia

---

# Permissões

Player

↓

Apenas seus próprios dados.

Administrador

↓

Acesso completo.

Sistema

↓

Operações automáticas.

---

# Estrutura do Projeto

js/

engine/

pages/

assets/

docs/

firebase/

---

# Objetivo Final

O Magnus Files deve ser escalável.

Novos sistemas poderão ser adicionados sem alterar a arquitetura existente.

Toda expansão deverá seguir este documento.

---

# Modelo Global de Entidades

Toda entidade armazenada no Magnus Files deverá seguir uma estrutura base.

Essa estrutura garante consistência entre todas as coleções do sistema.

Ela funciona como uma "classe base" para todas as entidades.

Nenhuma entidade poderá remover esses campos obrigatórios.

---

## Estrutura Base

id

Identificador permanente da entidade.

Nunca muda.

Exemplo

CHR-000001

---

type

Tipo da entidade.

Exemplo

character

case

creature

attack

effect

battle

item

---

version

Versão do documento.

Utilizada para futuras migrações.

Exemplo

1

---

status

Estado atual da entidade.

Valores padrão

active

inactive

archived

deleted

draft

---

createdAt

Data de criação.

Sempre armazenada em UTC.

---

updatedAt

Última atualização.

Sempre armazenada em UTC.

---

createdBy

ID do usuário que criou a entidade.

Exemplo

USR-000004

---

updatedBy

ID do último usuário que modificou.

---

ownerId

Define o proprietário principal da entidade.

Nem toda entidade possuirá um proprietário.

Exemplo

Personagem

↓

USR-000004

Caso

↓

Administrador

---

permissions

Lista de permissões específicas.

Permite futuras exceções.

Exemplo

Leitura

Escrita

Administrador

---

tags

Lista de palavras-chave.

Utilizada para pesquisas rápidas.

Exemplo

sobrenatural

ritual

criatura

hospital

---

metadata

Espaço reservado para futuras expansões.

Nunca utilizado para armazenar informações principais.

Serve apenas para compatibilidade.

---

# Exemplo

{

    id: "CHR-000001",

    type: "character",

    version: 1,

    status: "active",

    ownerId: "USR-000002",

    createdBy: "USR-000001",

    updatedBy: "USR-000001",

    createdAt: "...",

    updatedAt: "...",

    tags: [

        "detetive",

        "instituto"

    ],

    permissions: {

        read: [

            "USR-000001"

        ],

        write: [

            "USR-000001"

        ]

    },

    metadata: {}

}

---

# Regras

Todos os documentos do banco herdam esta estrutura.

Personagens

↓

Modelo Base

+

Campos do Personagem

Casos

↓

Modelo Base

+

Campos do Caso

Criaturas

↓

Modelo Base

+

Campos da Criatura

Ataques

↓

Modelo Base

+

Campos do Ataque

Nunca duplicar os campos da estrutura base.

Todos devem manter exatamente os mesmos nomes.

---

# Benefícios

• Padronização completa do banco de dados.

• Migração simplificada entre versões.

• Logs consistentes.

• Permissões unificadas.

• Busca e filtragem facilitadas.

• Escalabilidade para futuras funcionalidades.

---

# UserModel

Representa qualquer pessoa que possui acesso ao sistema do Instituto Magnus.

Todo usuário possui uma conta própria e pode estar vinculado a um ou mais personagens.

O UserModel é utilizado para autenticação, permissões e preferências pessoais.

---

## Campos Específicos

name

Nome de exibição do usuário.

Exemplo

Arthur

---

login

Identificador utilizado para entrar no sistema.

Pode ser alterado futuramente para e-mail ou outro método de autenticação.

---

role

Define o nível de acesso.

Valores permitidos

player

admin

system

---

characterIds

Lista de personagens pertencentes ao usuário.

Exemplo

CHR-000001

CHR-000014

---

activeCharacterId

Personagem atualmente selecionado.

Caso o usuário possua mais de um personagem, este campo define qual está sendo utilizado na sessão atual.

---

preferences

Preferências pessoais do usuário.

Exemplo

Tema

Idioma

Volume

Configurações de interface

---

lastLogin

Data do último acesso ao sistema.

---

lastIPAddress

Último endereço IP registrado.

Utilizado apenas para fins administrativos.

---

session

Informações temporárias da sessão atual.

Exemplo

Data de início

Status da conexão

Versão do cliente

---

# Exemplo

{

    id: "USR-000001",

    type: "user",

    version: 1,

    status: "active",

    name: "Arthur",

    login: "Arthur",

    role: "player",

    characterIds: [

        "CHR-000001"

    ],

    activeCharacterId: "CHR-000001",

    preferences: {},

    lastLogin: "...",

    lastIPAddress: "...",

    session: {}

}

---

# Permissões

## Player

Pode:

• Entrar no sistema.

• Editar apenas seus próprios personagens (quando permitido).

• Visualizar casos liberados.

• Participar de batalhas.

Não pode:

• Editar personagens de outros jogadores.

• Alterar configurações globais.

• Criar ou excluir usuários.

---

## Admin

Possui acesso completo ao sistema.

Pode:

• Editar qualquer entidade.

• Criar personagens.

• Criar criaturas.

• Gerenciar casos.

• Iniciar batalhas.

• Aplicar dano.

• Aplicar efeitos.

• Alterar permissões.

• Gerenciar usuários.

---

## System

Usuário reservado para operações automáticas da Engine.

Nunca realiza login manual.

É utilizado para:

• Migrações.

• Scripts automáticos.

• Operações internas.

---

# Relacionamentos

User

↓

possui

↓

Character(s)

User

↓

participa

↓

Battle(s)

User

↓

acessa

↓

Case(s)

---

# CharacterModel

Representa um personagem jogável pertencente a um usuário.

Todo personagem herda automaticamente a Estrutura Base de Entidades.

O CharacterModel define exclusivamente as informações da ficha.

---

# Informações Básicas

name

Nome do personagem.

---

photo

Imagem principal da ficha.

Armazena apenas o ID da mídia.

Exemplo

MED-000023

---

age

Idade.

---

type

Categoria do personagem.

Exemplos

Investigador

Civil

Criatura

NPC

Outro

---

description

Descrição geral do personagem.

Pode conter histórico, aparência e observações.

---

# Atributos

Todos os atributos possuem dois valores.

current

Valor atual.

base

Valor original.

Isso permite efeitos temporários sem alterar permanentemente a ficha.

---

will

Vontade.

{

base,

current

}

---

agility

Agilidade.

{

base,

current

}

---

intellect

Intelecto.

{

base,

current

}

---

# Limites

limit

Valor atual do Limite.

Também possui

base

current

---

effortLimit

Limite de esforço.

Define quantos pontos podem ser gastos simultaneamente.

Também utiliza

base

current

---

# Vida

health

{

maximum,

current,

temporary

}

maximum

Valor máximo.

current

Valor atual.

temporary

Vida temporária.

---

# Energia

energy

{

maximum,

current,

temporary

}

Segue exatamente a mesma lógica da Vida.

---

# Ataques

attackIds

Lista de IDs.

Exemplo

ATK-000001

ATK-000014

ATK-000078

---

# Habilidades

abilityIds

Lista de habilidades.

---

# Efeitos

effectIds

Lista dos efeitos atualmente ativos.

Cada efeito aponta para um documento próprio.

---

# Inventário

inventory

Lista de itens.

Cada posição contém apenas o ID do item.

---

# Casos

caseIds

Casos em que o personagem participa.

---

# Status

alive

Indica se o personagem está vivo.

Valores

true

false

---

active

Indica se pode ser utilizado.

Valores

true

false

---

# Histórico

history

Lista cronológica de acontecimentos importantes.

Exemplos

Criado

Participou de batalha

Recebeu efeito

Entrou em caso

Subiu atributo

Recebeu item

---

# Exemplo

{

id:"CHR-000001",

name:"Arthur",

photo:"MED-000021",

age:22,

type:"Investigador",

description:"...",

will:{

base:4,

current:4

},

agility:{

base:3,

current:3

},

intellect:{

base:5,

current:5

},

limit:{

base:3,

current:3

},

effortLimit:{

base:2,

current:2

},

health:{

maximum:18,

current:18,

temporary:0

},

energy:{

maximum:12,

current:12,

temporary:0

},

attackIds:[

"ATK-000001",

"ATK-000004"

],

abilityIds:[

"ABL-000002"

],

effectIds:[

"EFT-000009"

],

inventory:[

"ITM-000012"

],

caseIds:[

"CAS-000001"

],

alive:true,

active:true,

history:[]

}

---

# Regras

A ficha nunca armazena ataques completos.

A ficha nunca armazena habilidades completas.

A ficha nunca armazena efeitos completos.

A ficha nunca armazena itens completos.

Apenas referências.

Toda lógica pertence aos respectivos sistemas.

O CharacterModel apenas organiza essas referências.

---

# Responsabilidades

O CharacterModel é responsável por:

• Informações do personagem.

• Atributos.

• Vida.

• Energia.

• Limites.

• Inventário.

• Referências para ataques.

• Referências para habilidades.

• Referências para efeitos.

• Referências para casos.

Não calcula dano.

Não aplica efeitos.

Não executa habilidades.

Essas responsabilidades pertencem aos sistemas especializados.

---

# CreatureModel

Representa qualquer criatura, entidade, animal, NPC hostil ou aliado
controlado pelo sistema ou pelo administrador.

Todo CreatureModel herda automaticamente a Estrutura Base de Entidades.

Sua estrutura é semelhante ao CharacterModel para permitir compatibilidade
com o sistema de combate.

---

# Informações Básicas

name

Nome da criatura.

---

photoIds

Lista de imagens da criatura.

Uma criatura pode possuir diversas fotografias.

Exemplo

MED-000021

MED-000034

---

classification

Classificação da criatura.

Exemplos

Anomalia

Humano

Animal

Entidade

Objeto

Outro

---

species

Espécie da criatura.

Exemplo

Observador

Sombra

Humano

Desconhecida

---

description

Descrição física e comportamental.

---

dangerLevel

Nível de ameaça.

Valores sugeridos

I

II

III

IV

V

---

# Atributos

will

{

base,

current

}

---

agility

{

base,

current

}

---

intellect

{

base,

current

}

---

# Limites

limit

{

base,

current

}

---

effortLimit

{

base,

current

}

---

# Vida

health

{

maximum,

current,

temporary

}

---

# Energia

energy

{

maximum,

current,

temporary

}

---

# Ataques

attackIds

Lista de ataques disponíveis.

---

# Habilidades

abilityIds

Lista de habilidades.

---

# Efeitos Ativos

effectIds

Lista de efeitos atualmente aplicados.

---

# Casos

caseIds

Casos em que a criatura aparece.

---

# Recompensas

rewards

Define recompensas por derrotar ou capturar a criatura.

Pode conter:

Itens

Informações

Documentos

Novos casos

Experiência (caso exista futuramente)

---

# Comportamento

behavior

Modo de atuação da criatura.

Valores sugeridos

Passive

Neutral

Hostile

Aggressive

Scripted

---

# Status

alive

true

false

---

active

true

false

---

captured

true

false

---

# Histórico

history

Registro cronológico de eventos envolvendo a criatura.

Exemplos

Criada

Vista em caso

Capturada

Eliminada

Recebeu efeito

---

# Exemplo

{

id:"CRE-000001",

name:"Observador",

photoIds:[

"MED-000051",

"MED-000052"

],

classification:"Entidade",

species:"Desconhecida",

description:"...",

dangerLevel:"III",

will:{

base:6,

current:6

},

agility:{

base:4,

current:4

},

intellect:{

base:8,

current:8

},

limit:{

base:4,

current:4

},

effortLimit:{

base:3,

current:3

},

health:{

maximum:30,

current:30,

temporary:0

},

energy:{

maximum:18,

current:18,

temporary:0

},

attackIds:[

"ATK-000011",

"ATK-000025"

],

abilityIds:[

"ABL-000008"

],

effectIds:[],

caseIds:[

"CAS-000003"

],

rewards:[],

behavior:"Hostile",

alive:true,

active:true,

captured:false,

history:[]

}

---

# Regras

A criatura nunca armazena ataques completos.

A criatura nunca armazena habilidades completas.

A criatura nunca armazena efeitos completos.

Todos esses dados são armazenados em suas respectivas coleções.

O CreatureModel apenas mantém referências.

---

# Responsabilidades

O CreatureModel é responsável por:

• Informações da criatura.

• Atributos.

• Vida.

• Energia.

• Limites.

• Referências para ataques.

• Referências para habilidades.

• Referências para efeitos.

• Participação em casos.

• Estado atual da criatura.

Não calcula dano.

Não executa ataques.

Não aplica efeitos.

Essas funções pertencem aos sistemas especializados.

---

# AttackModel

Representa qualquer ação executável durante uma batalha.

Um AttackModel pode representar:

• Ataques físicos.

• Ataques à distância.

• Rituais.

• Técnicas.

• Poderes sobrenaturais.

• Curas.

• Suportes.

• Habilidades ofensivas.

Todo AttackModel herda automaticamente a Estrutura Base de Entidades.

---

# Informações Básicas

name

Nome do ataque.

---

description

Descrição completa do ataque.

Explica visualmente o que acontece.

---

icon

Ícone utilizado na interface.

Armazena apenas o ID da mídia.

---

category

Categoria principal.

Valores sugeridos

Physical

Ranged

Mental

Support

Healing

Special

Passive

---

element

Elemento utilizado.

Exemplos

None

Fire

Ice

Electric

Light

Dark

Blood

Void

Custom

---

# Custos

energyCost

Quantidade de Energia consumida.

---

limitCost

Quantidade de Limite consumida.

---

effortCost

Quantidade de Limite de Esforço utilizada.

---

cooldown

Quantidade de turnos necessária para reutilizar.

0 significa que não possui tempo de espera.

---

# Alvo

target

Quem pode receber o ataque.

Valores sugeridos

Self

Ally

Enemy

Area

Everyone

---

range

Alcance do ataque.

Exemplos

Touch

Short

Medium

Long

Unlimited

---

# Dano

damage

Define como o dano será calculado.

{

base,

attribute,

multiplier

}

Exemplo

{

base:4,

attribute:"will",

multiplier:2

}

---

damageType

Tipo do dano.

Exemplos

Physical

Mental

Energy

True

Healing

Custom

---

# Precisão

accuracy

Chance base de acerto.

Valor entre

0

e

100

---

criticalChance

Chance crítica.

---

criticalMultiplier

Multiplicador do dano crítico.

---

# Efeitos

effectIds

Lista de efeitos aplicados caso o ataque acerte.

Exemplo

EFT-000012

EFT-000031

---

# Restrições

requirements

Condições necessárias para utilizar.

Exemplos

Possuir item

Possuir habilidade

Status específico

Outro efeito ativo

---

# Animação

animation

Identificador da animação utilizada.

---

sound

Identificador do áudio utilizado.

---

# Histórico

history

Registro de alterações do ataque.

---

# Exemplo

{

id:"ATK-000001",

name:"Golpe Concentrado",

description:"Canaliza energia antes de atingir o alvo.",

icon:"MED-000031",

category:"Physical",

element:"None",

energyCost:2,

limitCost:0,

effortCost:1,

cooldown:0,

target:"Enemy",

range:"Touch",

damage:{

base:5,

attribute:"will",

multiplier:2

},

damageType:"Physical",

accuracy:90,

criticalChance:10,

criticalMultiplier:2,

effectIds:[

"EFT-000003"

],

requirements:[],

animation:"slash_01",

sound:"AUD-000014",

history:[]

}

---

# Regras

O AttackModel nunca modifica diretamente um personagem.

O AttackModel nunca calcula dano sozinho.

O AttackModel apenas define como um ataque funciona.

O sistema de combate será responsável por interpretar esses dados.

---

# Responsabilidades

O AttackModel é responsável por:

• Nome.

• Descrição.

• Custos.

• Alvo.

• Alcance.

• Tipo de dano.

• Fórmula base.

• Efeitos aplicados.

• Restrições.

• Recursos visuais.

Não aplica dano.

Não remove energia.

Não reduz vida.

Não executa efeitos.

Essas responsabilidades pertencem ao BattleSystem.

---

# AbilityModel

Representa qualquer habilidade pertencente a um personagem ou criatura.

Diferente dos ataques, uma habilidade não precisa ser utilizada manualmente.

Ela pode ser:

• Passiva.

• Ativa.

• Automática.

• Reativa.

Todo AbilityModel herda automaticamente a Estrutura Base de Entidades.

---

# Informações Básicas

name

Nome da habilidade.

---

description

Descrição completa.

Explica exatamente seu funcionamento.

---

icon

Ícone utilizado na interface.

Armazena apenas o ID da mídia.

---

category

Categoria.

Valores sugeridos

Passive

Active

Reaction

Aura

Ultimate

Special

---

activation

Momento em que a habilidade pode ser ativada.

Valores sugeridos

Manual

Automatic

TurnStart

TurnEnd

OnAttack

OnHit

OnDamage

OnHeal

OnDeath

BattleStart

BattleEnd

Always

---

# Custos

energyCost

Energia necessária.

---

limitCost

Limite necessário.

---

effortCost

Esforço necessário.

---

cooldown

Turnos até reutilização.

---

# Alvo

target

Self

Ally

Enemy

Area

Everyone

None

---

range

Touch

Short

Medium

Long

Unlimited

---

# Efeitos

effectIds

Lista de efeitos aplicados.

---

# Modificadores

modifiers

Lista de modificadores permanentes ou temporários.

Exemplos

+2 Agilidade

+25% Dano

-1 Custo de Energia

+10 Precisão

---

# Requisitos

requirements

Condições necessárias.

Exemplos

Nível mínimo

Ataque específico

Outro efeito

Item equipado

---

# Recursos

animation

Animação.

---

sound

Som.

---

# Histórico

history

Registro de alterações.

---

# Exemplo

{

id:"ABL-000001",

name:"Instinto de Sobrevivência",

description:"Quando a Vida ficar abaixo de 30%, recupera 2 de Energia e recebe o efeito Determinação.",

icon:"MED-000042",

category:"Passive",

activation:"OnDamage",

energyCost:0,

limitCost:0,

effortCost:0,

cooldown:3,

target:"Self",

range:"None",

effectIds:[

"EFT-000008"

],

modifiers:[],

requirements:[],

animation:"survival",

sound:"AUD-000041",

history:[]

}

---

# Regras

A AbilityModel nunca altera diretamente uma entidade.

Ela apenas define:

• Quando ativa.

• Quem afeta.

• Quais efeitos aplica.

Toda execução pertence ao BattleSystem.

---

# Responsabilidades

A AbilityModel é responsável por:

• Definir habilidades.

• Definir gatilhos.

• Definir custos.

• Definir modificadores.

• Definir efeitos.

Não calcula dano.

Não altera atributos.

Não aplica efeitos diretamente.

Essas funções pertencem ao BattleSystem.

---

# EffectModel

Representa qualquer efeito temporário ou permanente que possa ser aplicado
a uma entidade do sistema.

Um efeito pode alterar atributos, causar dano ao longo do tempo, impedir
ações, conceder bônus ou modificar regras do combate.

Todo EffectModel herda automaticamente a Estrutura Base de Entidades.

---

# Informações Básicas

name

Nome do efeito.

---

description

Descrição completa do efeito.

---

icon

Ícone utilizado na interface.

Armazena apenas o ID da mídia.

---

category

Categoria do efeito.

Valores sugeridos

Buff

Debuff

Status

DamageOverTime

HealOverTime

Control

Passive

Special

---

# Duração

duration

Quantidade de turnos.

Valores especiais

0

Instantâneo

-1

Permanente

---

stackable

Define se o efeito pode acumular.

Valores

true

false

---

maxStacks

Quantidade máxima de acúmulos.

Exemplo

5

---

# Aplicação

application

Momento em que o efeito executa sua ação.

Valores sugeridos

Immediate

TurnStart

TurnEnd

OnAttack

OnHit

OnDamage

OnHeal

BattleStart

BattleEnd

Always

---

# Alvo

target

Valores sugeridos

Self

Ally

Enemy

Area

Everyone

---

# Modificadores

modifiers

Lista de modificações aplicadas enquanto o efeito estiver ativo.

Exemplos

+2 Agilidade

-1 Vontade

+20% Precisão

-30% Velocidade

Imune a Sangramento

---

# Dano ou Cura

tick

Executado sempre que o efeito for ativado.

{

type,

value,

attribute,

multiplier

}

Exemplo

{

type:"Damage",

value:3,

attribute:"will",

multiplier:1

}

---

# Remoção

removeOn

Condições para remover automaticamente.

Exemplos

Fim da duração

Receber cura

Receber dano

Início da batalha

Fim da batalha

Manual

---

# Recursos

animation

Animação.

---

sound

Som.

---

# Histórico

history

Registro de alterações.

---

# Exemplo

{

id:"EFT-000001",

name:"Sangramento",

description:"Perde Vida ao final de cada turno.",

icon:"MED-000061",

category:"DamageOverTime",

duration:3,

stackable:true,

maxStacks:5,

application:"TurnEnd",

target:"Enemy",

modifiers:[],

tick:{

type:"Damage",

value:2,

attribute:null,

multiplier:1

},

removeOn:"Duration",

animation:"bleeding",

sound:"AUD-000053",

history:[]

}

---

# Exemplos de Efeitos

Buff

• Determinação

• Escudo

• Inspiração

• Regeneração

---

Debuff

• Sangramento

• Queimadura

• Veneno

• Congelamento

• Fraqueza

---

Controle

• Atordoado

• Paralisado

• Silenciado

• Cego

• Confuso

---

Especiais

• Invisibilidade

• Marca

• Proteção Divina

• Amaldiçoado

---

# Regras

O EffectModel nunca altera diretamente uma entidade.

Ele apenas define:

• Quando executa.

• O que modifica.

• Quanto dura.

• Como termina.

Quem interpreta essas regras é o BattleSystem.

---

# Responsabilidades

O EffectModel é responsável por:

• Definir buffs.

• Definir debuffs.

• Definir estados.

• Definir modificadores.

• Definir duração.

• Definir empilhamento.

• Definir execução periódica.

Não modifica atributos diretamente.

Não calcula dano.

Não remove Vida.

Não altera Energia.

Essas responsabilidades pertencem ao BattleSystem.

---

# CaseModel

Representa uma investigação oficial do Instituto Magnus.

Todo CaseModel herda automaticamente a Estrutura Base de Entidades.

Um caso funciona como um contêiner que organiza todos os elementos relacionados
a uma investigação.

---

# Informações Básicas

name

Nome oficial do caso.

---

code

Código interno da investigação.

Exemplo

CASE-17

OP-004

SIGMA-12

---

description

Resumo da investigação.

---

cover

Imagem principal.

Armazena apenas o ID da mídia.

---

status

Estado atual do caso.

Valores sugeridos

Draft

Open

Investigation

Paused

Solved

Archived

Cancelled

---

priority

Prioridade da investigação.

Valores sugeridos

Low

Medium

High

Critical

---

classification

Nível de sigilo.

Valores sugeridos

Public

Restricted

Confidential

TopSecret

---

# Participantes

characterIds

Lista de personagens participantes.

---

userIds

Usuários autorizados.

---

# Criaturas

creatureIds

Lista de criaturas relacionadas.

---

# Evidências

evidenceIds

Lista de evidências cadastradas.

Cada evidência será um documento próprio.

---

# Documentos

documentIds

Lista de documentos.

---

# Áudios

audioIds

Lista de gravações.

---

# Imagens

mediaIds

Lista de fotografias e mídias.

---

# Locais

locationIds

Locais envolvidos.

Cada local será uma entidade própria.

---

# Eventos

eventIds

Eventos importantes da investigação.

Exemplo

Primeiro contato.

Ataque.

Descoberta.

Conclusão.

---

# Notas

noteIds

Lista de anotações.

---

# Quadro Investigativo

boardId

ID do quadro investigativo.

Cada caso possui apenas um quadro.

---

# Linha do Tempo

timeline

Registro cronológico dos acontecimentos.

---

# Histórico

history

Registro administrativo.

Exemplos

Caso criado.

Novo investigador adicionado.

Criatura registrada.

Documento anexado.

Caso encerrado.

---

# Exemplo

{

id:"CAS-000001",

name:"O Observador",

code:"CASE-17",

description:"Investigação sobre desaparecimentos em uma estação abandonada.",

cover:"MED-000120",

status:"Investigation",

priority:"High",

classification:"Restricted",

characterIds:[

"CHR-000001",

"CHR-000008"

],

userIds:[

"USR-000001",

"USR-000003"

],

creatureIds:[

"CRE-000002"

],

evidenceIds:[

"EVD-000001",

"EVD-000004"

],

documentIds:[

"DOC-000010"

],

audioIds:[

"AUD-000021"

],

mediaIds:[

"MED-000122",

"MED-000123"

],

locationIds:[

"LOC-000001"

],

eventIds:[

"EVT-000007"

],

noteIds:[

"NOT-000003"

],

boardId:"BRD-000001",

timeline:[],

history:[]

}

---

# Regras

O CaseModel nunca armazena personagens completos.

O CaseModel nunca armazena criaturas completas.

O CaseModel nunca armazena documentos completos.

O CaseModel nunca armazena áudios completos.

O CaseModel apenas mantém referências para outras entidades.

---

# Responsabilidades

O CaseModel é responsável por:

• Organizar uma investigação.

• Definir participantes.

• Relacionar criaturas.

• Agrupar evidências.

• Agrupar documentos.

• Agrupar mídias.

• Agrupar eventos.

• Referenciar o Quadro Investigativo.

Não controla combate.

Não controla personagens.

Não controla criaturas.

Não interpreta evidências.

Essas responsabilidades pertencem aos sistemas especializados.

---

# BattleModel

Representa uma batalha em andamento ou encerrada.

Todo BattleModel herda automaticamente a Estrutura Base de Entidades.

Uma batalha é uma entidade independente do restante do sistema.

Ela apenas referencia personagens, criaturas e demais entidades envolvidas.

---

# Informações Básicas

name

Nome da batalha.

Exemplo

Combate da Estação

---

description

Descrição da batalha.

---

caseId

Caso ao qual a batalha pertence.

Pode ser nulo.

---

status

Estado da batalha.

Valores permitidos

Waiting

Running

Paused

Finished

Cancelled

---

# Participantes

participants

Lista de participantes.

Cada participante possui:

{

entityId,

entityType,

team,

initiative,

alive

}

entityType

Valores

Character

Creature

NPC

---

team

Equipe do participante.

Exemplos

A

B

Neutral

---

initiative

Valor utilizado para definir a ordem dos turnos.

---

alive

Situação atual durante a batalha.

---

# Ordem dos Turnos

turn

Número atual do turno.

---

round

Rodada atual.

---

activeParticipant

ID do participante que está jogando.

---

initiativeOrder

Lista ordenada dos participantes.

Exemplo

CHR-000001

CRE-000002

CHR-000004

---

# Estado da Batalha

weather

Condição global.

Exemplos

Normal

Rain

Darkness

Fog

Fire

---

environment

Informações do cenário.

Exemplo

Sala Fechada

Floresta

Hospital

Outro

---

globalEffectIds

Lista de efeitos que afetam toda a batalha.

---

# Ações

actions

Registro cronológico das ações executadas.

Cada ação pode conter:

Autor

Alvo

Ataque

Resultado

Dano

Efeitos

Horário

---

# Logs

logs

Registro detalhado da batalha.

Utilizado para replay e auditoria.

---

# Resultado

winner

Equipe vencedora.

---

endedAt

Data de encerramento.

---

# Histórico

history

Registro administrativo.

Exemplos

Batalha criada.

Participante entrou.

Participante saiu.

Batalha encerrada.

---

# Exemplo

{

id:"BTL-000001",

name:"Combate da Estação",

description:"",

caseId:"CAS-000003",

status:"Running",

participants:[

{

entityId:"CHR-000001",

entityType:"Character",

team:"A",

initiative:17,

alive:true

},

{

entityId:"CRE-000004",

entityType:"Creature",

team:"B",

initiative:14,

alive:true

}

],

turn:6,

round:2,

activeParticipant:"CHR-000001",

initiativeOrder:[

"CHR-000001",

"CRE-000004"

],

weather:"Normal",

environment:"Estação Abandonada",

globalEffectIds:[

"EFT-000014"

],

actions:[],

logs:[],

winner:null,

endedAt:null,

history:[]

}

---

# Regras

A batalha nunca armazena personagens completos.

A batalha nunca armazena criaturas completas.

A batalha nunca altera permanentemente uma entidade.

Todas as alterações realizadas durante o combate permanecem na batalha até serem processadas pelo BattleSystem.

---

# Responsabilidades

O BattleModel é responsável por:

• Organizar participantes.

• Controlar turnos.

• Controlar rodadas.

• Registrar ações.

• Registrar logs.

• Armazenar efeitos globais.

• Registrar resultado.

Não calcula dano.

Não executa ataques.

Não aplica efeitos.

Não altera fichas de personagens.

Essas responsabilidades pertencem ao BattleSystem.

---

# Modelos de Suporte

Os modelos abaixo representam entidades auxiliares utilizadas pelos
demais sistemas do Magnus Files.

Todos herdam automaticamente a Estrutura Base de Entidades.

---

# ItemModel

Representa qualquer item do sistema.

Pode ser:

• Arma

• Ferramenta

• Consumível

• Documento físico

• Chave

• Evidência

• Equipamento

Campos específicos

name

description

category

icon

weight

stackable

maxStack

effectIds

value

rarity

---

# DocumentModel

Representa documentos encontrados durante uma investigação.

Pode conter:

• Texto

• PDF

• Relatórios

• Cartas

• Registros

Campos

title

description

mediaId

author

createdDate

tags

---

# EvidenceModel

Representa uma evidência catalogada.

Campos

name

description

type

mediaIds

locationId

foundBy

foundAt

relatedCaseId

---

# NoteModel

Representa anotações criadas pelos jogadores
ou administradores.

Campos

title

content

authorId

caseId

characterId

pinned

---

# MediaModel

Representa qualquer arquivo de mídia.

Pode ser:

• Imagem

• Vídeo

• Ilustração

• Ícone

Campos

name

type

path

thumbnail

size

extension

uploadedBy

---

# AudioModel

Representa gravações de áudio.

Campos

name

description

mediaId

duration

transcription

speaker

language

---

# LocationModel

Representa um local do universo.

Campos

name

description

address

coordinates

mediaIds

caseIds

---

# EventModel

Representa acontecimentos importantes.

Campos

title

description

date

locationId

participantIds

caseId

mediaIds

---

# InvestigationBoardModel

Representa o Quadro Investigativo.

Cada caso possui um único quadro.

Campos

caseId

nodeIds

connectionIds

layout

---

# BoardNodeModel

Representa um elemento do quadro.

Pode apontar para:

Personagem

Criatura

Documento

Nota

Áudio

Imagem

Evento

Outro

Campos

entityId

entityType

position

color

icon

---

# BoardConnectionModel

Representa uma ligação entre dois nós.

Campos

sourceNode

targetNode

label

color

style

---

# Regras

Todos os modelos de suporte são independentes.

Eles nunca armazenam entidades completas.

Sempre utilizam referências por ID.

Qualquer entidade pode ser reutilizada em diversos casos sem duplicação.

---

# Benefícios

• Estrutura altamente modular.

• Compartilhamento de informações.

• Eliminação de dados duplicados.

• Organização consistente.

• Fácil expansão futura.

---

# Relacionamentos

Esta seção define oficialmente como todas as entidades do Magnus Files
se relacionam entre si.

As relações são sempre realizadas através de IDs.

Nenhuma entidade armazena outra entidade completa.

---

# Usuários

User

↓

possui

↓

Character(s)

---

User

↓

participa de

↓

Case(s)

---

User

↓

participa de

↓

Battle(s)

---

User

↓

cria

↓

Notes

Documents

Media

Audios

---

# Personagens

Character

↓

possui

↓

Attack(s)

---

Character

↓

possui

↓

Ability(s)

---

Character

↓

recebe

↓

Effect(s)

---

Character

↓

possui

↓

Item(s)

---

Character

↓

participa de

↓

Case(s)

---

Character

↓

participa de

↓

Battle(s)

---

# Criaturas

Creature

↓

possui

↓

Attack(s)

---

Creature

↓

possui

↓

Ability(s)

---

Creature

↓

recebe

↓

Effect(s)

---

Creature

↓

participa de

↓

Case(s)

---

Creature

↓

participa de

↓

Battle(s)

---

# Ataques

Attack

↓

aplica

↓

Effect(s)

---

Attack

↓

pode exigir

↓

Ability(s)

---

Attack

↓

utiliza

↓

Media

Audio

Animation

---

# Habilidades

Ability

↓

aplica

↓

Effect(s)

---

Ability

↓

modifica

↓

Attack(s)

---

Ability

↓

modifica

↓

Character

Creature

---

# Efeitos

Effect

↓

afeta

↓

Character

Creature

Battle

---

# Casos

Case

↓

possui

↓

Character(s)

Creature(s)

---

Case

↓

possui

↓

Evidence(s)

---

Case

↓

possui

↓

Document(s)

---

Case

↓

possui

↓

Audio(s)

---

Case

↓

possui

↓

Media(s)

---

Case

↓

possui

↓

Location(s)

---

Case

↓

possui

↓

Event(s)

---

Case

↓

possui

↓

Note(s)

---

Case

↓

possui

↓

InvestigationBoard

---

# Batalhas

Battle

↓

possui

↓

Participants

---

Battle

↓

possui

↓

Actions

---

Battle

↓

possui

↓

Logs

---

Battle

↓

possui

↓

Global Effects

---

Battle

↓

pertence opcionalmente a

↓

Case

---

# Itens

Item

↓

aplica

↓

Effect(s)

---

Item

↓

pertence a

↓

Character

Creature

---

# Evidências

Evidence

↓

pertence a

↓

Case

---

Evidence

↓

pode referenciar

↓

Media

Document

Audio

Location

---

# Documentos

Document

↓

pertence a

↓

Case

---

Document

↓

pode utilizar

↓

Media

---

# Áudios

Audio

↓

pertence a

↓

Case

---

Audio

↓

utiliza

↓

Media

---

# Locais

Location

↓

participa de

↓

Case(s)

---

Location

↓

possui

↓

Media

---

Location

↓

possui

↓

Event(s)

---

# Eventos

Event

↓

pertence a

↓

Case

---

Event

↓

ocorre em

↓

Location

---

Event

↓

envolve

↓

Character(s)

Creature(s)

---

# Quadro Investigativo

InvestigationBoard

↓

pertence a

↓

Case

---

InvestigationBoard

↓

possui

↓

BoardNode(s)

---

InvestigationBoard

↓

possui

↓

BoardConnection(s)

---

BoardNode

↓

referencia

↓

Qualquer Entidade

---

BoardConnection

↓

liga

↓

BoardNode

---

# Fluxo Geral

User

↓

Character

↓

Attack

↓

Effect

↓

Battle

↓

Case

↓

Evidence

↓

Document

↓

Media

↓

Investigation Board

---

# Regras Gerais

Todos os relacionamentos utilizam IDs.

Nenhuma entidade armazena outra entidade completa.

Qualquer entidade pode ser reutilizada em diferentes sistemas.

Uma alteração em uma entidade é refletida automaticamente
em todas as referências.

Os relacionamentos devem permanecer desacoplados,
permitindo expansão futura sem alterar os modelos existentes.

---

# Permissões e Controle de Acesso

O Magnus Files utiliza um sistema de permissões baseado em papéis
(Roles) e propriedade (Ownership).

Toda operação realizada no sistema deve verificar as permissões
antes de ser executada.

---

# Papéis do Sistema

Existem três papéis principais.

Player

Administrador

System

---

# Player

Representa um jogador.

Pode:

• Entrar no sistema.

• Visualizar seus personagens.

• Editar seus personagens (quando permitido).

• Participar de batalhas.

• Visualizar casos aos quais possui acesso.

• Criar notas pessoais.

• Visualizar documentos liberados.

Não pode:

• Criar usuários.

• Excluir usuários.

• Alterar configurações globais.

• Editar personagens de outros jogadores.

• Criar criaturas.

• Alterar ataques oficiais.

• Alterar habilidades oficiais.

---

# Administrator

Representa um Mestre ou Administrador do Instituto.

Possui acesso completo.

Pode:

• Criar usuários.

• Editar usuários.

• Remover usuários.

• Criar personagens.

• Editar qualquer personagem.

• Criar criaturas.

• Editar criaturas.

• Criar casos.

• Encerrar casos.

• Criar batalhas.

• Encerrar batalhas.

• Criar ataques.

• Criar habilidades.

• Criar efeitos.

• Gerenciar arquivos.

• Gerenciar permissões.

• Alterar configurações.

---

# System

Usuário reservado para operações automáticas.

Nunca realiza login.

Pode:

• Executar migrações.

• Atualizar versões.

• Gerar registros.

• Criar logs.

• Executar tarefas automáticas.

---

# Ownership

Toda entidade pode possuir um proprietário.

ownerId

Define quem é responsável pela entidade.

Exemplo

Character

↓

USR-000004

---

Case

↓

Administrador responsável

---

Media

↓

Usuário que realizou o envio

---

# Compartilhamento

Uma entidade pode ser compartilhada.

permissions

{

read:[],

write:[],

admin:[]

}

---

Exemplo

{

read:[

"USR-000001",

"USR-000008"

],

write:[

"USR-000001"

],

admin:[

"USR-000001"

]

}

---

# Permissões por Entidade

User

Player

↓

Somente sua própria conta.

Administrador

↓

Todas.

---

Character

Player

↓

Se for proprietário.

Administrador

↓

Todos.

---

Creature

Somente administradores.

---

Attack

Somente administradores.

---

Ability

Somente administradores.

---

Effect

Somente administradores.

---

Case

Jogador

↓

Apenas casos autorizados.

Administrador

↓

Todos.

---

Battle

Jogador

↓

Batalhas em que participa.

Administrador

↓

Todas.

---

Document

Depende das permissões do caso.

---

Evidence

Depende das permissões do caso.

---

Media

Depende das permissões da entidade relacionada.

---

# Regras Gerais

Toda operação deve verificar:

1

Usuário autenticado.

↓

2

Permissão da entidade.

↓

3

Propriedade.

↓

4

Estado da entidade.

↓

5

Executar ação.

---

# Exclusão

Nenhuma entidade importante será removida fisicamente.

Sempre utilizar:

status

↓

deleted

Dessa forma o histórico permanece preservado.

---

# Auditoria

Toda alteração importante deve gerar um registro.

Exemplos

Criação.

Atualização.

Remoção.

Mudança de proprietário.

Mudança de permissões.

Encerramento de caso.

Início de batalha.

Fim de batalha.

---

# Objetivo

Garantir segurança.

Evitar alterações indevidas.

Permitir expansão futura.

Manter todo o histórico do sistema.

---

# Fluxo Completo da Aplicação

Esta seção descreve o fluxo geral de funcionamento do Magnus Files.

Ela representa a ordem em que os sistemas são inicializados e como o usuário
interage com a aplicação.

---

# Inicialização

Usuário abre o Magnus Files

↓

Carregamento da aplicação

↓

Inicialização da Magnus Engine

↓

Leitura do Manifest

↓

Inicialização dos módulos

↓

State

↓

Events

↓

Firebase

↓

Database

↓

Loader

↓

UI

↓

Menu

↓

Router

↓

Application

↓

Tela inicial

---

# Autenticação

Usuário

↓

Login

↓

Firebase Authentication

↓

Verificação do usuário

↓

Carregamento do UserModel

↓

Criação da sessão

↓

Home

---

# Home

A Home é o ponto central do sistema.

A partir dela o usuário pode acessar:

↓

Personagens

Casos

Combate

Arquivos

Configurações

Administração (quando permitido)

---

# Fluxo dos Personagens

Home

↓

Lista de Personagens

↓

Selecionar Personagem

↓

Carregar CharacterModel

↓

Carregar Ataques

↓

Carregar Habilidades

↓

Carregar Efeitos

↓

Carregar Inventário

↓

Abrir Ficha

---

# Fluxo dos Casos

Home

↓

Lista de Casos

↓

Selecionar Caso

↓

Carregar CaseModel

↓

Carregar Participantes

↓

Carregar Criaturas

↓

Carregar Evidências

↓

Carregar Documentos

↓

Carregar Áudios

↓

Carregar Imagens

↓

Carregar Eventos

↓

Carregar Quadro Investigativo

↓

Abrir Investigação

---

# Fluxo do Combate

Caso

↓

Criar Batalha

↓

BattleModel

↓

Carregar Participantes

↓

Ordenar Iniciativa

↓

Iniciar Turno

↓

Executar Ataques

↓

Executar Habilidades

↓

Aplicar Efeitos

↓

Registrar Logs

↓

Próximo Turno

↓

Fim da Batalha

↓

Atualizar Dados Permanentes

---

# Fluxo dos Arquivos

Home

↓

Arquivos

↓

Enviar Arquivo

↓

MediaModel

↓

Salvar no Storage

↓

Registrar no Banco

↓

Disponibilizar Referência

---

# Fluxo Administrativo

Administrador

↓

Painel Administrativo

↓

Usuários

↓

Personagens

↓

Criaturas

↓

Casos

↓

Ataques

↓

Habilidades

↓

Efeitos

↓

Logs

↓

Configurações

---

# Persistência

Sempre que uma alteração é realizada:

↓

Validação

↓

Permissões

↓

Atualização da Entidade

↓

Registro de Auditoria

↓

Sincronização com Firebase

↓

Atualização da Interface

---

# Encerramento

Usuário

↓

Logout

↓

Encerrar Sessão

↓

Limpar Estado Local

↓

Retornar para Login

---

# Fluxo Geral

                  Login
                    │
                    ▼
          Firebase Authentication
                    │
                    ▼
             Magnus Engine
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 Personagens      Casos       Administração
      │             │             │
      ▼             ▼             ▼
 Character      CaseModel     Gerenciamento
      │             │
      ▼             ▼
 Combate     Investigação
      │             │
      └──────┬──────┘
             ▼
        Banco de Dados
             │
             ▼
         Firebase Cloud
             │
             ▼
      Atualização da Interface

---

# Princípios Gerais

• Toda funcionalidade passa pela Engine.

• A Interface nunca acessa o banco diretamente.

• Toda operação é validada antes da execução.

• Os Models armazenam apenas dados.

• Os Systems executam a lógica.

• Os Modules organizam os Systems.

• Toda alteração importante gera auditoria.

• Toda entidade é identificada por ID.

• Toda comunicação entre módulos utiliza a Engine.

---

# Objetivo Final

O Magnus Files foi projetado para ser um sistema modular, escalável e
desacoplado.

Novos módulos poderão ser adicionados sem modificar a arquitetura
existente.

Toda nova funcionalidade deverá seguir o fluxo definido neste documento.