<?php

class Site
{
    public static function email(): string
    {
        return Env::get('SITE_EMAIL', 'info@villagenetacad.co.za');
    }
}
