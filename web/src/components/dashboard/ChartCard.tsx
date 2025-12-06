import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Dataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
}

interface ChartCardProps {
  title: string
  subtitle: string
  labels: string[]
  datasets: Dataset[]
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, labels, datasets }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      tension: 0.4,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 4
    }))
  }

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h5>{title}</h5>
        <p>{subtitle}</p>
      </div>
      <div className="chart-container">
        <Line options={options} data={data} />
      </div>
    </div>
  )
}

export default ChartCard

