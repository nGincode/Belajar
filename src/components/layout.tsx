interface layout {
    children: any
}
const Layout = ({ children }: layout) => {

    return (
        <div>
            ini layout
            {children}
        </div>
    )
}

export default Layout;