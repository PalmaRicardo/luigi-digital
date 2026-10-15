// ─── SweetAlert2 helpers ──────────────────────────────────────────────────────
// Alertas centralizadas con estilo de la marca y soporte para modo oscuro.

import Swal from 'sweetalert2';

const isDark = () => document.documentElement.classList.contains('dark');

const base = () => ({
  background: isDark() ? '#111a2e' : '#ffffff',
  color: isDark() ? '#eef4f8' : '#0f172a',
  confirmButtonColor: '#6153d6',
  cancelButtonColor: isDark() ? '#334155' : '#94a3b8',
  customClass: { popup: 'swal-ld-popup' },
});

const Toast = () =>
  Swal.mixin({
    ...base(),
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    didOpen: el => {
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

export const toast = {
  success: (title: string) => Toast().fire({ icon: 'success', title }),
  error: (title: string) => Toast().fire({ icon: 'error', title }),
  info: (title: string) => Toast().fire({ icon: 'info', title }),
  warning: (title: string) => Toast().fire({ icon: 'warning', title }),
};

export const alertError = (title: string, text?: string) =>
  Swal.fire({ ...base(), icon: 'error', title, text, confirmButtonText: 'Entendido' });

export const alertSuccess = (title: string, text?: string) =>
  Swal.fire({ ...base(), icon: 'success', title, text, timer: 1800, showConfirmButton: false });

export async function confirmAction(
  title: string,
  text?: string,
  opts: { confirmText?: string; danger?: boolean } = {}
): Promise<boolean> {
  const r = await Swal.fire({
    ...base(),
    icon: opts.danger === false ? 'question' : 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: opts.danger === false ? '#6153d6' : '#dc2626',
    reverseButtons: true,
    focusCancel: true,
  });
  return r.isConfirmed;
}
