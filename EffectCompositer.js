import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';
const EffectCompositer = {

    uniforms: {
        'godrays': { value: null },
        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'projectionMatrixInv': { value: new THREE.Matrix4() },
        'viewMatrixInv': { value: new THREE.Matrix4() },
        'lightPos': { value: new THREE.Vector3() },
        'resolution': { value: new THREE.Vector2() },
        'sceneCube': { value: null },
        'depthCube': { value: null },
        'environment': { value: null },
        'normalTexture': { value: null },
        'time': { value: 0.0 },
        'cameraPos': { value: null },
        'edgeRadius': { value: 0.0 },
        'edgeStrength': { value: 0.0 },
        'color': { value: new THREE.Vector3() }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
    fragmentShader: /*glsl*/ `
    #include <common>
    uniform sampler2D godrays;
    uniform sampler2D sceneDiffuse;
    uniform sampler2D sceneDepth;
    uniform float edgeStrength;
    uniform float edgeRadius;
    uniform vec2 resolution;
    uniform vec3 color;
    varying vec2 vUv;
    #define DITHERING
    #include <dithering_pars_fragment>
    float linearize_depth(float d,float zNear,float zFar)
    {
        return zNear * zFar / (zFar + d * (zNear - zFar));
    }  
    void main() {
        vec4 diffuse = texture2D(sceneDiffuse, vUv);
        float correctDepth = linearize_depth(texture2D(sceneDepth, vUv).x, 0.1, 1000.0);
        float minDist = 100000.0;
        vec2 pushDir = vec2(0.0);
        float count = 0.0;
        for(float x = -edgeRadius; x <= edgeRadius; x++) {
            for(float y = -edgeRadius; y <= edgeRadius; y++) {
                vec2 sampleUv = (vUv * resolution + vec2(x, y)) / resolution;
                float sampleDepth = linearize_depth(texture2D(sceneDepth, sampleUv).x, 0.1, 1000.0);
                if (abs(sampleDepth - correctDepth) < 0.05 * correctDepth) {
                    pushDir += vec2(x, y);
                   count += 1.0;
                }
            }
        }
        if (count == 0.0) {
            count = 1.0;
        }
        pushDir /= count;
       pushDir = normalize(pushDir);
       vec2 sampleUv = length(pushDir) > 0.0 ? vUv + edgeStrength * (pushDir / resolution) : vUv;
        float bestChoice = texture2D(godrays, sampleUv).x;
        //vec2 texel = (floor(vUv * (resolution * 0.5) + 0.5 + 1.0 * vec2(x, y)) / (resolution * 0.5));
        //float diff = abs(linearize_depth(correctDepth, 0.1, 1000.0) - linearize_depth(texture2D(sceneDepth, texel).x, 0.1, 1000.0));
       //
       /* if (diff > 1.0) {
            gl_FragColor = vec4(vec3(1.0), 1.0);
            return;
            minDist = diff;
            bestChoice = texture2D(godrays, texel).x;
        }*/
        gl_FragColor = vec4(mix(diffuse.rgb, color, bestChoice), 1.0);
        #include <dithering_fragment>
    }  
        `
}
export { EffectCompositer }