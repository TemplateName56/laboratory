import Link from 'next/link'
 
function Home() {
  return (
    <ul>
      <li>
        <Link href="/">Home</Link>
      </li>
      <li>
        <Link href="/page_">LEDs turning on/off in order</Link>
      </li>
      <li>
        <Link href="/page_rgb">RGB-LED color changed by pressing buttons</Link>
      </li>
    </ul>
  )
}
 
export default Home