// Selectors use roles and accessible names only, so the specs keep passing
// through markup and styling refactors and double as an accessibility check.

const NODES_TABLE = { name: 'Fleet nodes' };

function waitForTelemetry() {
  // The table only renders once the first snapshot has been applied.
  cy.findByRole('table', NODES_TABLE).should('be.visible');
}

describe('Fleet operations dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
    waitForTelemetry();
  });

  it('connects to the stream and summarises the fleet', () => {
    cy.findByText('Connected').should('be.visible');
    cy.findByRole('region', { name: 'Fleet overview' }).within(() => {
      cy.findByText('Total Active Nodes').next().should('have.text', '200');
      cy.findByText('Critical Alerts')
        .next()
        .invoke('text')
        .then((text) => expect(Number(text)).to.be.greaterThan(0));
    });
  });

  it('filters the table down to critical nodes only', () => {
    cy.findByRole('combobox', { name: 'Status' }).select('Critical');

    cy.findByRole('table', NODES_TABLE).within(() => {
      // `should` with a callback is retried, so rows that change while the
      // stream keeps flowing never produce a stale-element failure.
      cy.findAllByRole('row').should(($rows) => {
        const bodyRows = $rows.slice(1); // first row is the header
        expect(bodyRows.length, 'critical rows').to.be.greaterThan(0);
        bodyRows.each((_, row) => {
          expect(row.textContent).to.contain('Critical');
        });
      });
    });

    cy.contains(/Showing \d+ of 200 nodes/).should('be.visible');
  });

  it('opens the detail of a critical node with live telemetry and charts', () => {
    cy.findByRole('combobox', { name: 'Status' }).select('Critical');

    // With the default sort the first critical row is stable across ticks.
    cy.findByRole('table', NODES_TABLE).within(() => {
      cy.findAllByRole('rowheader').first().invoke('text').as('nodeId');
    });
    cy.get<string>('@nodeId').then((nodeId) => {
      cy.findByRole('button', { name: nodeId }).click();

      cy.findByRole('region', { name: 'Node detail' }).within(() => {
        cy.findByRole('heading', { name: nodeId }).should('be.visible');
        cy.findByText('CPU', { selector: 'dt' }).next().should('contain.text', '%');
        cy.findByText('Memory', { selector: 'dt' }).next().should('contain.text', '%');
        cy.findByText('Latency', { selector: 'dt' }).next().should('contain.text', 'ms');

        cy.findByRole('img', { name: /^CPU over the last \d+ samples/ }).should('be.visible');
        cy.findByRole('img', { name: /^Latency over the last \d+ samples/ }).should('be.visible');
      });
    });
  });

  it('keeps the chart moving while the stream flows', () => {
    cy.findByRole('button', { name: 'node-001' }).click();

    const sampleCount = ($chart: JQuery<HTMLElement>) =>
      Number(/last (\d+) samples/.exec($chart.attr('aria-label') ?? '')?.[1] ?? 0);

    cy.findByRole('region', { name: 'Node detail' }).within(() => {
      cy.findByRole('img', { name: /^CPU over the last \d+ samples/ }).then(($chart) => {
        const before = sampleCount($chart);

        cy.findByRole('img', { name: /^CPU over the last \d+ samples/ }).should(($next) => {
          expect(sampleCount($next)).to.be.greaterThan(before);
        });
      });
    });
  });
});
