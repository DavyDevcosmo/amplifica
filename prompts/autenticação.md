## Autenticação

Objetivo: o fluxo de conta que já está 100% especificado.

1. Configurar better-auth com provider de credenciais (e-mail + senha) 
2. Cadastro com código de verificação de 6 dígitos por e-mail
    - Registro temporário com expiração de 30 min
    - Código válido por 10 min, uso único, máx. 5 tentativas
    - Reenvio com cooldown de 60s
3. Login com bloqueio progressivo após tentativas falhas
4. Recuperação de senha (token de 1h, invalidação de sessões)
5. Login social (Google)
6. Middleware de rotas protegidas com retorno ao ponto de origem
7. Página de perfil do usuário (editar nome, senha, foto)

**Pronto quando**: dá para criar conta, verificar e-mail, logar, deslogar e recuperar senha.

**Testar**: E2E do cadastro completo e do login com credencial errada, crie testes quando necessario com viteste e react react testing library e controle os estados com zustend