declare module 'cose-to-jwk' {
  import { JWK } from 'jwk-to-pem'

  type COSEArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array
    | ArrayBuffer
    | any[]
    | Buffer

  export function algToStr(alg: number): string
  export function algToHashStr(alg: number | string): string
  export default function coseToJwk(coseArray: COSEArray): JWK
}
