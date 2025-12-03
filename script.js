// ETF Data Constants (Real Data as of Late 2025)
// CAGR: 10-Year Compound Annual Growth Rate (Total Return with Dividends Reinvested)
// Yield: Current Dividend Yield
const ETF_DATA = {
    'VOO': { return: 14.52, yield: 1.10, name: 'Vanguard S&P 500 ETF' },
    'QQQ': { return: 19.30, yield: 0.46, name: 'Invesco QQQ Trust' },
    'VTI': { return: 13.90, yield: 1.10, name: 'Vanguard Total Stock Market' },
    'SCHD': { return: 11.78, yield: 3.76, name: 'Schwab US Dividend Equity' },
    'SPY': { return: 14.50, yield: 1.09, name: 'SPDR S&P 500 ETF Trust' },
    'IVV': { return: 14.52, yield: 1.10, name: 'iShares Core S&P 500 ETF' }
};

// DOM Elements
const form = document.getElementById('calculator-form');
const tickerInput = document.getElementById('ticker');
const fetchBtn = document.getElementById('fetch-btn');
const initialDepositInput = document.getElementById('initial-deposit');
const monthlyContributionInput = document.getElementById('monthly-contribution');
const yearsInput = document.getElementById('years');
const yearsRange = document.getElementById('years-range');
const returnRateInput = document.getElementById('return-rate');
const dataSourceHint = document.getElementById('data-source-hint');

// Result Elements
const totalValueEl = document.getElementById('total-value');
const totalContributedEl = document.getElementById('total-contributed');
const interestEarnedEl = document.getElementById('interest-earned');
const ctx = document.getElementById('growthChart').getContext('2d');

let growthChart;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Sync slider and number input
    yearsRange.addEventListener('input', (e) => {
        yearsInput.value = e.target.value;
    });
    yearsInput.addEventListener('input', (e) => {
        yearsRange.value = e.target.value;
    });

    // Auto-select text on focus for easier editing
    tickerInput.addEventListener('focus', function () {
        this.select();
    });

    // Fetch button listener
    fetchBtn.addEventListener('click', () => {
        const ticker = tickerInput.value.toUpperCase();
        fetchETFData(ticker);
    });

    // Form submit listener
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndRender();
    });

    // Initial calculation
    calculateAndRender();
});

// Data Fetching Logic with Caching
async function fetchETFData(ticker) {
    if (!ticker) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `etf_data_${ticker}_${today} `;

    // 1. Check Cache
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log(`Loading ${ticker} from cache`);
        applyData(JSON.parse(cachedData));
        return;
    }

    // 2. Fetch (Simulated for MVP)
    console.log(`Fetching ${ticker} from "API"...`);

    // Simulate network delay
    fetchBtn.textContent = 'Loading...';
    fetchBtn.disabled = true;

    setTimeout(() => {
        // In a real app, this would be fetch(`https://api.example.com/etf/${ticker}`)
        const data = ETF_DATA[ticker];

        if (data) {
            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify(data));
            applyData(data);
            dataSourceHint.innerHTML = `Loaded for <b>${data.name}</b><br>Avg. Return: ${data.return}% | Div. Yield: ${data.yield}%`;
            dataSourceHint.style.color = '#10b981';
        } else {
            dataSourceHint.textContent = 'Ticker not found in database';
            dataSourceHint.style.color = '#ef4444';
        }

        fetchBtn.textContent = 'Update Data';
        fetchBtn.disabled = false;
    }, 800);
}

function applyData(data) {
    returnRateInput.value = data.return;
    // Flash effect to show update
    returnRateInput.style.backgroundColor = '#1e293b';
    setTimeout(() => returnRateInput.style.backgroundColor = '', 300);
}

// Calculation Logic
function calculateAndRender() {
    const initial = parseFloat(initialDepositInput.value) || 0;
    const monthly = parseFloat(monthlyContributionInput.value) || 0;
    const years = parseFloat(yearsInput.value) || 10;
    const annualRate = parseFloat(returnRateInput.value) || 0;

    // We use monthly compounding, which is standard for investment calculators.
    // The annualRate is treated as the nominal annual rate.
    // Monthly Rate = Annual Rate / 12
    const monthlyRate = annualRate / 100 / 12;

    let balance = initial;
    let totalContributed = initial;
    const labels = [];
    const dataPoints = [];

    // Generate data points for chart (yearly)
    for (let i = 0; i <= years; i++) {
        labels.push(`Year ${i}`);
        dataPoints.push(balance);

        // Calculate next year's growth
        if (i < years) {
            for (let m = 0; m < 12; m++) {
                // Compound Interest Formula with Monthly Contributions:
                // New Balance = (Previous Balance * (1 + Monthly Rate)) + Monthly Contribution
                // This assumes interest is applied to the existing balance first,
                // and then the monthly contribution is added at the end of the period.
                // This is a common and conservative approach for investment calculators.
                balance = balance * (1 + monthlyRate) + monthly;

                totalContributed += monthly;
            }
        }
    }

    // Update UI Text
    totalValueEl.textContent = formatCurrency(balance);
    totalContributedEl.textContent = formatCurrency(totalContributed);
    interestEarnedEl.textContent = formatCurrency(balance - totalContributed);

    // Update Chart
    renderChart(labels, dataPoints);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(num);
}

// Chart Logic
function renderChart(labels, data) {
    if (growthChart) {
        growthChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#334155',
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: '#334155',
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return '$' + value / 1000 + 'k';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}
