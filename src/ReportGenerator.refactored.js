const USER_MAX_VALUE = 500;
const PRIORITY_VALUE = 1000;

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    let report = this.buildHeader(reportType, user);
    let total = 0;

    this.markPriorityItems(user, items);

    for (const item of this.getVisibleItems(user, items)) {
      const line = this.formatItem(reportType, item, user);
      report += line;
      if (line) {
        total += item.value;
      }
    }

    return `${report}${this.buildFooter(reportType, total)}`.trim();
  }

  buildHeader(reportType, user) {
    const headers = {
      CSV: () => 'ID,NOME,VALOR,USUARIO\n',
      HTML: () => '<html><body>\n<h1>Relatório</h1>\n'
        + `<h2>Usuário: ${user.name}</h2>\n`
        + '<table>\n<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    };

    return headers[reportType]?.() ?? '';
  }

  buildFooter(reportType, total) {
    const footers = {
      CSV: () => `\nTotal,,\n${total},,\n`,
      HTML: () => `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
    };

    return footers[reportType]?.() ?? '';
  }

  getVisibleItems(user, items) {
    const visibilityRules = {
      ADMIN: () => true,
      USER: (item) => item.value <= USER_MAX_VALUE,
    };
    const isVisible = visibilityRules[user.role];

    return isVisible ? items.filter(isVisible) : [];
  }

  markPriorityItems(user, items) {
    if (user.role !== 'ADMIN') {
      return;
    }

    items.forEach((item) => {
      if (item.value > PRIORITY_VALUE) {
        item.priority = true;
      }
    });
  }

  formatItem(reportType, item, user) {
    const formatters = {
      CSV: () => `${item.id},${item.name},${item.value},${user.name}\n`,
      HTML: () => {
        const style = item.priority ? 'style="font-weight:bold;"' : '';
        const openingTag = style ? `<tr ${style}>` : '<tr>';
        return `${openingTag}<td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
      },
    };

    return formatters[reportType]?.() ?? '';
  }
}