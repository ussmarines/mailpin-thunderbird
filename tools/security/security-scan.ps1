[CmdletBinding()]
param([ValidateSet('Quick','Full')][string]$Profile='Full',[switch]$Enforce)
$ErrorActionPreference='Stop'
$argsList=@((Join-Path $PSScriptRoot 'run_security_suite.py'),'--profile',$Profile.ToLowerInvariant())
if($Enforce){$argsList+='--enforce'}
& py -3 @argsList
exit $LASTEXITCODE
