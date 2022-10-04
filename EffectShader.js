import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';
const EffectShader = {

    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'projectionMatrixInv': { value: new THREE.Matrix4() },
        'viewMatrixInv': { value: new THREE.Matrix4() },
        'lightPos': { value: new THREE.Vector3() },
        'resolution': { value: new THREE.Vector2() },
        'sceneCube': { value: null },
        'depthCube': { value: null },
        'environment': { value: null },
        'time': { value: 0.0 },
        'cameraPos': { value: null },
        'mapSize': { value: 512.0 },
        'far': { value: 200.0 },
        'near': { value: 0.5 },
        'blueNoise': { value: null },
        'noiseResolution': { value: new THREE.Vector2() }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
    varying vec2 vUv;
		uniform sampler2D sceneDiffuse;
    uniform sampler2D sceneDepth;
    uniform sampler2D blueNoise;
    uniform vec3 lightPos;
    uniform vec3 cameraPos;
    uniform vec2 resolution;
    uniform float time;
    uniform mat4 projectionMatrixInv;
    uniform mat4 viewMatrixInv;
    uniform samplerCube sceneCube;
    uniform sampler2D depthCube;
    uniform samplerCube environment;
    uniform vec2 noiseResolution;
    uniform float mapSize;
    uniform float far;
    uniform float near;
    #include <packing>
    vec3 WorldPosFromDepth(float depth, vec2 coord) {
      float z = depth * 2.0 - 1.0;
      vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
      vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
      // Perspective division
      viewSpacePosition /= viewSpacePosition.w;
      vec4 worldSpacePosition = viewMatrixInv * viewSpacePosition;
      return worldSpacePosition.xyz;
  }
  vec3 computeNormal(vec3 worldPos, vec2 vUv) {
vec2 downUv = vUv + vec2(0.0, 1.0 / (resolution.y * 1.0));
vec3 downPos = WorldPosFromDepth( texture2D(sceneDepth, downUv).x, downUv);
vec2 rightUv = vUv + vec2(1.0 / (resolution.x * 1.0), 0.0);;
vec3 rightPos = WorldPosFromDepth(texture2D(sceneDepth, rightUv).x, rightUv);
vec2 upUv = vUv - vec2(0.0, 1.0 / (resolution.y * 0.01));
vec3 upPos = WorldPosFromDepth(texture2D(sceneDepth, upUv).x, upUv);
vec2 leftUv = vUv - vec2(1.0 / (resolution.x * 1.0), 0.0);;
vec3 leftPos = WorldPosFromDepth(texture2D(sceneDepth, leftUv).x, leftUv);
int hChoice;
int vChoice;
if (length(leftPos - worldPos) < length(rightPos - worldPos)) {
  hChoice = 0;
} else {
  hChoice = 1;
}
if (length(upPos - worldPos) < length(downPos - worldPos)) {
  vChoice = 0;
} else {
  vChoice = 1;
}
vec3 hVec;
vec3 vVec;
if (hChoice == 0 && vChoice == 0) {
  hVec = leftPos - worldPos;
  vVec = upPos - worldPos;
} else if (hChoice == 0 && vChoice == 1) {
  hVec = leftPos - worldPos;
  vVec = worldPos - downPos;
} else if (hChoice == 1 && vChoice == 1) {
  hVec = rightPos - worldPos;
  vVec = downPos - worldPos;
} else if (hChoice == 1 && vChoice == 0) {
  hVec = rightPos - worldPos;
  vVec = worldPos - upPos;
}
return normalize(cross(hVec, vVec));
}
    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }      
    float linearize_depth(float d,float zNear,float zFar)
    {
        return zNear * zFar / (zFar + d * (zNear - zFar));
    }  
    vec2 cubeToUV( vec3 v, float texelSizeY ) {
      // Number of texels to avoid at the edge of each square
      vec3 absV = abs( v );
      // Intersect unit cube
      float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
      absV *= scaleToCube;
      // Apply scale to avoid seams
      // two texels less per square (one texel will do for NEAREST)
      v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
      // Unwrap
      // space: -1 ... 1 range for each square
      //
      // #X##		dim    := ( 4 , 2 )
      //  # #		center := ( 1 , 1 )
      vec2 planar = v.xy;
      float almostATexel = 1.5 * texelSizeY;
      float almostOne = 1.0 - almostATexel;
      if ( absV.z >= almostOne ) {
        if ( v.z > 0.0 )
          planar.x = 4.0 - v.x;
      } else if ( absV.x >= almostOne ) {
        float signX = sign( v.x );
        planar.x = v.z * signX + 2.0 * signX;
      } else if ( absV.y >= almostOne ) {
        float signY = sign( v.y );
        planar.x = v.x + 2.0 * signY + 2.0;
        planar.y = v.z * signY - 2.0;
      }
      // Transform to UV space
      // scale := 0.5 / dim
      // translate := ( center + 0.5 ) / dim
      return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
    }
    float inShadow(vec3 worldPos) {
      float depth = near + (far - near) * unpackRGBAToDepth(texture2D(depthCube, cubeToUV(normalize(worldPos - lightPos), 1.0 / (mapSize * 2.0))));//linearize_depth(unpackRGBAToDepth(texture2D(depthCube, cubeToUV(normalize(worldPos - lightPos), 1.0 / 1024.0))), 0.5, 200.0);//1000.0 * textureCube(depthCube, worldPos - lightPos).r;
      float difference = distance(worldPos, lightPos) - depth;
      return float(difference > 0.01);
    }
    float seed = 0.0;
uint hash( uint x ) {
  x += ( x << 10u );
  x ^= ( x >>  6u );
  x += ( x <<  3u );
  x ^= ( x >> 11u );
  x += ( x << 15u );
  return x;
}



// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }



// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
  const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
  const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

  m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
  m |= ieeeOne;                          // Add fractional part to 1.0

  float  f = uintBitsToFloat( m );       // Range [1:2]
  return f - 1.0;                        // Range [0:1]
}



// Pseudo-random value in half-open range [0:1].
float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }

float rand()
{
/*float result = fract(sin(seed + mod(time, 1000.0) + dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
//_Seed += 1.0;
seed += 1.0;
return result;*/
float result = random(vec4(gl_FragCoord.xy, seed, 0.0));
seed += 1.0;
return result;
}

		void main() {
            vec4 diffuse = texture2D(sceneDiffuse, vUv);
            float depth = texture2D(sceneDepth, vUv).x;
            vec4 blueNoiseSample = texture2D(blueNoise, vUv * (resolution / noiseResolution));
            //if (depth < 1.0) {
            vec3 worldPos = WorldPosFromDepth(depth, vUv);
            float illum = 0.0;
            //inShadow(worldPos);
            float samples = round(60.0 + 8.0 * blueNoiseSample.x);//64.0;
            for(float i = 0.0; i < samples; i++) {
              vec3 samplePos = mix(cameraPos, worldPos, i / samples);
              illum += (1.0 - inShadow(samplePos)) * (distance(cameraPos, worldPos) / samples) * exp(-0.005 * distance(worldPos, lightPos));
            }
           illum /= samples;
            gl_FragColor = vec4(vec3(clamp((1.0 - exp(-illum)), 0.0, 0.5)), depth);
           /* vec3 reflectDir = reflect(normalize(worldPos - cameraPos), normal);
            vec3 pos = worldPos + 0.01 * reflectDir;
            vec3 reflectColor = vec3(0.0);
            bool hit = false;
            for(float i = 0.0; i < 200.0; i++) {
              pos += reflectDir * 0.25* max(distance(pos, cameraPos) / 50.0, 1.0);
              float depth = textureCube(depthCube, pos - cameraPos).r;
              float difference = distance(pos, cameraPos) - depth;
              if (difference > 0.25 && difference < 1.0) {
                reflectColor = textureCube(sceneCube, pos - cameraPos).rgb;
                hit = true;
                break;
              }
            }
            if (!hit) {
              reflectColor = textureCube(environment, reflectDir).rgb;
            }
            gl_FragColor = vec4(mix(diffuse.rgb, reflectColor, 0.25), 1.0);*/

          //} else {
          //  gl_FragColor = vec4(diffuse.rgb, 1.0);
         // }
		}`

};

export { EffectShader };