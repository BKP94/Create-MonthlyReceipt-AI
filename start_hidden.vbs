Dim sh
Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c cd /d C:\Project_BEER\Monthly_Receipt\backend\FinanceApi && dotnet run", 0, False
sh.Run "cmd /c cd /d C:\Project_BEER\Monthly_Receipt\frontend && npm run dev", 0, False
