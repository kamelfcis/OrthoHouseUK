import { Link } from 'react-router-dom'
import './ButtonWithIcon.css'

const ButtonWithIcon = ({ 
  text = "Get Started", 
  icon = "fas fa-hand-pointer", 
  to = "#", 
  onClick,
  variant = "main",
  iconTeal = true 
}) => {
  const ButtonContent = () => (
    <span className="lte-btn-inner">
      <span className={`lte-icon ${iconTeal ? 'icon-teal' : ''}`}>
        <i className={icon}></i>
      </span>
      <span>{text}</span>
    </span>
  )

  const className = `lte-btn hasIcon btn-${variant}`

  if (to && to !== '#') {
    return (
      <Link to={to} className={className}>
        <ButtonContent />
      </Link>
    )
  }

  return (
    <button className={className} onClick={onClick}>
      <ButtonContent />
    </button>
  )
}

export default ButtonWithIcon
