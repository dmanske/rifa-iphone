@echo off
echo ========================================
echo DEPLOY DO WEBHOOK STRIPE
echo ========================================
echo.

echo Verificando Docker...
docker --version
if errorlevel 1 (
    echo ERRO: Docker nao esta instalado ou nao esta rodando!
    echo Por favor instale Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo Docker OK! Prosseguindo...
echo.

echo Fazendo deploy da funcao stripe-webhook...
npx supabase functions deploy stripe-webhook --project-ref pwhicfgtakcpiedtdiqn

if errorlevel 1 (
    echo ERRO no deploy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o webhook no Stripe Dashboard
echo 2. Configure STRIPE_WEBHOOK_SECRET
echo 3. Teste um pagamento
echo.
pause 