import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller()
export class PagesController {
  // =========================================================
  // LOGIN
  // =========================================================
  @Public()
  @Get('/')
  @Render('pages/login')
  loginRoot() {
    return {
      pageTitle: 'Login',
      bodyClass: 'login-page',
      currentPage: 'login',
      hideSidebar: true,
      hideNavbar: true,
    };
  }

  @Public()
  @Get('/login')
  @Render('pages/login')
  login() {
    return {
      pageTitle: 'Login',
      bodyClass: 'login-page',
      currentPage: 'login',
      hideSidebar: true,
      hideNavbar: true,
    };
  }

  // =========================================================
  // DASHBOARD ÚNICO
  // ---------------------------------------------------------
  // Por ahora dejamos estas rutas públicas para probar
  // el front en entorno real como veníamos haciendo.
  // Más adelante, cuando el dashboard único quede estable,
  // quitamos @Public() y protegemos estas vistas con JWT.
  // =========================================================

  @Public()
  @Get('/admin')
  @Render('pages/dashboard')
  admin() {
    return this.buildDashboardPage('admin', 'ADMIN');
  }

  @Public()
  @Get('/supervisor')
  @Render('pages/dashboard')
  supervisor() {
    return this.buildDashboardPage('supervisor', 'JEFE');
  }

  @Public()
  @Get('/vendor')
  @Render('pages/dashboard')
  vendor() {
    return this.buildDashboardPage('vendor', 'VENDEDOR');
  }

  // =========================================================
  // HELPER PRIVADO
  // ---------------------------------------------------------
  // Esto evita repetir el mismo objeto 3 veces.
  // "entryRole" sirve solo como contexto inicial de la ruta.
  // El rol real lo debe validar luego el front con la sesión/JWT.
  // =========================================================
private buildDashboardPage(entryPage: string, requiredRole: string) {
  return {
    pageTitle: 'ManagerUK',
    bodyClass: 'dashboard-page',
    currentPage: 'dashboard',
    entryPage,
    requiredRole,
    hideSidebar: true,
    hideNavbar: true,
  };
}
}