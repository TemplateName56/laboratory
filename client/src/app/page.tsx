import Link from 'next/link'
 
function Home() {
  return (
    <ul>
      <li>
        <Link href="/">Home</Link>
      </li>
      <li>
        <Link href="/page_rgb">Експеремент № 1</Link>
      </li>
      <li>
        <Link href="/page_sam_rob">Експеремент № 2</Link>
      </li>
    </ul>
  )
}
 
export default Home