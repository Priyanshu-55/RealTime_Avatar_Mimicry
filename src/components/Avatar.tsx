import {useGLTF} from '@react-three/drei'
import {useGraph} from '@react-three/fiber'
function Avatar(){
    const avatar  = useGLTF('/Model.glb')

    const {nodes} = useGraph(avatar.scene)
    return <primitive object={avatar.scene} position={[0, -1, 3]} />
}

export default Avatar;