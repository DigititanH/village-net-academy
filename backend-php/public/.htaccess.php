RewriteEngine On

# Pass Authorization header to PHP (Apache/cPanel often strips it)
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Block direct access to env if ever copied into public by mistake
<FilesMatch "^(\.env|\.env\..*)$">
  Require all denied
</FilesMatch>

# SPA + API front controller
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
