// モジュールの読み込み
import * as THREE from './lib/three.module.js';
// マウスで描画結果に干渉できる様にする為に、OrbitControlsというクラスをモジュール化して読み込み
import { OrbitControls } from './lib/OrbitControls.js';


//DOM の準備ができたら実行する（HTMLの読み込みとDOMツリー作成が終わったら中の関数を実行する）
window.addEventListener('DOMContentLoaded', () => {
    //HTML側にある空の<div id="webgl"></div>を参照
    const wrapper = document.querySelector('#webgl');

    //ThreeAppという「描画をまとめる自作クラス」を使って、WebGLの初期化と一回分の描画（レンダリング）を呼び出す
    const app = new ThreeApp(wrapper);
    app.render();
}, false);

//---------------------------------------------------------------------------------

//ThreeApp クラス定義
class ThreeApp {

    //まず初期値を書いておく
    //①カメラ定義のための初期値
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 10.0,
        position: new THREE.Vector3(5.0, 2.0, 3.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    //②レンダラー定義のための初期値
    static RENDERER_PARAM = {
        clearColor: 0x000000,       //背景色
        width: window.innerWidth,   //レンダラーに設定する幅
        height: window.innerHeight, //レンダラーに設定する高さ
    };

    //③ライト定義のための初期値
        //DirectionalLight：平行光源
        static DIRECTIONAL_LIGHT_PARAM = {
            color: 0x0045e0,                            //光の色
            intensity: 60.0,                             //光の強度
            position: new THREE.Vector3(30, 100, 50), //光の向き
        };

        //AmbientLight：環境光
        static AMBIENT_LIGHT_PARAM = {
            color: 0xd450ff, //光の色
            intensity: 900.0,  //光の強度
        };

    //④マテリアル定義のための初期値
    static MATERIAL_PARAM = {
        color: 0xffffff,            //ベースの色
        metalness: 1.0,             //メタリック
        roughness: 0.20,             //粗さ
        transmission: 1.0,          //伝搬
        clearcoat: 1.0,             //クリアコートの粗さ
        clearcoatRoughness: 0.0,    //クリアコートの伝搬
        reflectivity: 1.0           //スペキュラー
    };

//---------------------------------------------------------------------------------

    //プロパティ宣言（今後これらを使いますよというお知らせ）
    renderer;           //レンダラー
    scene;              //シーン
    camera;             // カメラ
    directionalLight;   // 平行光源
    ambientLight;       // 環境光
    geometry;           // ジオメトリ
    material;           // マテリアル
    controls;           // オービットコントロール
    box;                // ボックスメッシュ
    axesHelper;         // 軸ヘルパー（最後に消す）

//---------------------------------------------------------------------------------

    /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */

    //初期化処理
    constructor(wrapper) {
        //レンダラの初期化（canvasが生成される）
        const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
        this.renderer = new THREE.WebGLRenderer({ antialias: true }); //※キャンバスのアンチエイリアスを有効化
        this.renderer.setClearColor(color);
        this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
        wrapper.appendChild(this.renderer.domElement);


        //シーンの初期化
        this.scene = new THREE.Scene();


        //カメラの初期化
        this.camera = new THREE.PerspectiveCamera(
            ThreeApp.CAMERA_PARAM.fovy,
            ThreeApp.CAMERA_PARAM.aspect,
            ThreeApp.CAMERA_PARAM.near,
            ThreeApp.CAMERA_PARAM.far,
        );
        this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
        this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);


        // ライトの初期化
        this.directionalLight = new THREE.DirectionalLight(
            ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
            ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
        );
        this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
        this.scene.add(this.directionalLight);

        this.ambientLight = new THREE.AmbientLight(
            ThreeApp.AMBIENT_LIGHT_PARAM.color,
            ThreeApp.AMBIENT_LIGHT_PARAM.intensity
        );
        this.scene.add(this.ambientLight);

        //ジオメトリとマテリアルの初期化
        this.geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        this.material = new THREE.MeshPhysicalMaterial(ThreeApp.MATERIAL_PARAM);


        //BoxGeometryを量産
        const boxCount = 100;
        const transformScale = 6.0;
        this.boxArray = []; //生成したboxを格納する場所
        for (let i = 0; i < boxCount; ++i) {
            //メッシュのインスタンスを生成
            const box = new THREE.Mesh(this.geometry, this.material);

            //座標をランダムに散らす
            box.position.x = (Math.random() * 2.0 - 1.0) * transformScale;
            box.position.y = (Math.random() * 2.0 - 1.0) * transformScale;
            box.position.z = (Math.random() * 2.0 - 1.0) * transformScale;

            //回転もランダムにする（Math.PIは円周率、2πラジアン（360°）の範囲で回転）
            box.rotation.x = Math.random() * Math.PI * 2;
            box.rotation.y = Math.random() * Math.PI * 2;
            box.rotation.z = Math.random() * Math.PI * 2;

            //シーンに追加する
            this.scene.add(box);

            //配列に入れておく
            this.boxArray.push(box);
        }


        //メッシュの初期化
        this.box = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.box);


        //コントロールの初期化
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        //this.renderの中のthisを固定。ループ処理（requestAnimationFrame(this.render)）のコールバックに確実に渡す為。
        this.render = this.render.bind(this);


        //ウィンドウサイズの変更に対応
        window.addEventListener('resize', () => {
            // レンダラの大きさを設定
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            // カメラが撮影する視錐台のアスペクト比を再設定
            this.camera.aspect = window.innerWidth / window.innerHeight;
            // カメラのパラメータが変更されたときは行列を更新する
            this.camera.updateProjectionMatrix();
        }, false);


        //自動回転
        this.controls.autoRotate = true; //自動回転の有効化
        this.controls.autoRotateSpeed = 3.0; //回転速度

    }

//---------------------------------------------------------------------------------

    //描画処理
    render() {
        //renderをループで呼び出す（描画タイミングの制御）
        requestAnimationFrame(this.render);

        //new OrbitControlsで作ったコントローラを毎フレーム更新（カメラをどう動かすかの更新）
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
